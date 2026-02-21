import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { scrapeWebsite } from "@/lib/enrichment/scraper";
import { extractContactWithClaude } from "@/lib/enrichment/extract-contact";

export async function POST(request: NextRequest) {
  try {
    const { rowId, websiteUrl, existingData, columnNames } = await request.json();

    if (!rowId || !websiteUrl) {
      return NextResponse.json(
        { error: "rowId and websiteUrl are required" },
        { status: 400 }
      );
    }

    const firstNameCol = columnNames?.firstNameCol ?? "first_name";
    const lastNameCol = columnNames?.lastNameCol ?? "last_name";
    const titleCol = "Title";

    // Scrape website
    const { text, error: scrapeError } = await scrapeWebsite(websiteUrl);
    if (scrapeError || !text) {
      return NextResponse.json({
        success: false,
        error: scrapeError || "No text extracted",
      });
    }

    // Extract contact with Claude
    const contact = await extractContactWithClaude(text, existingData ?? {});

    if (!contact.first_name || contact.confidence === 0) {
      return NextResponse.json({
        success: false,
        error: "No contact identified",
      });
    }

    // Update row in Supabase
    const { data: row } = await supabaseServer
      .from("list_rows")
      .select("data, flags")
      .eq("id", rowId)
      .single();

    if (row) {
      const updatedData = { ...row.data };
      const updatedFlags = { ...row.flags };

      if (contact.first_name) {
        updatedData[firstNameCol] = contact.first_name;
        updatedFlags[firstNameCol] = "enriched";
      }
      if (contact.last_name) {
        updatedData[lastNameCol] = contact.last_name;
        updatedFlags[lastNameCol] = "enriched";
      }
      if (contact.title) {
        updatedData[titleCol] = contact.title;
        updatedFlags[titleCol] = "enriched";
      }
      // Track enrichment source
      updatedData["_enrichment_source"] = "website";

      await supabaseServer
        .from("list_rows")
        .update({ data: updatedData, flags: updatedFlags })
        .eq("id", rowId);
    }

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
