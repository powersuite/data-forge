import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { findEmail } from "@/lib/enrichment/icypeas";

export async function POST(request: NextRequest) {
  try {
    const { rowId, firstName, lastName, domain, columnNames, generatedEmail } = await request.json();

    if (!rowId) {
      return NextResponse.json(
        { success: false, error: "rowId is required" },
        { status: 400 }
      );
    }

    const emailCol = columnNames?.emailCol ?? "email";

    // If a generated email pattern was provided, save it directly without calling Icypeas
    if (generatedEmail) {
      const { data: row, error: fetchErr } = await supabaseServer
        .from("list_rows")
        .select("data, flags")
        .eq("id", rowId)
        .single();

      if (fetchErr || !row) {
        return NextResponse.json({
          success: false,
          error: `Failed to fetch row: ${fetchErr?.message ?? "row not found"}`,
        });
      }

      const updatedData = { ...row.data };
      const updatedFlags = { ...row.flags };

      updatedData[emailCol] = generatedEmail;
      updatedFlags[emailCol] = "enriched";
      const existingSource = updatedData["_enrichment_source"];
      updatedData["_enrichment_source"] = existingSource
        ? existingSource + "+pattern"
        : "pattern";

      const { error: updateErr } = await supabaseServer
        .from("list_rows")
        .update({ data: updatedData, flags: updatedFlags })
        .eq("id", rowId);

      if (updateErr) {
        return NextResponse.json({
          success: false,
          error: `Failed to save pattern email: ${updateErr.message}`,
        });
      }

      return NextResponse.json({
        success: true,
        email: generatedEmail,
      });
    }

    // Normal Icypeas flow
    if (!firstName || !lastName || !domain) {
      return NextResponse.json(
        { success: false, error: "firstName, lastName, and domain are required" },
        { status: 400 }
      );
    }

    const result = await findEmail(firstName, lastName, domain);

    if (result.email) {
      // Update row in Supabase
      const { data: row, error: fetchErr } = await supabaseServer
        .from("list_rows")
        .select("data, flags")
        .eq("id", rowId)
        .single();

      if (fetchErr || !row) {
        return NextResponse.json({
          success: false,
          error: `Found email ${result.email} but failed to fetch row: ${fetchErr?.message ?? "row not found"}`,
        });
      }

      const updatedData = { ...row.data };
      const updatedFlags = { ...row.flags };

      updatedData[emailCol] = result.email;
      updatedFlags[emailCol] = "enriched";
      // Track source
      const existingSource = updatedData["_enrichment_source"];
      updatedData["_enrichment_source"] = existingSource
        ? existingSource + "+icypeas"
        : "icypeas";

      const { error: updateErr } = await supabaseServer
        .from("list_rows")
        .update({ data: updatedData, flags: updatedFlags })
        .eq("id", rowId);

      if (updateErr) {
        return NextResponse.json({
          success: false,
          error: `Found email ${result.email} but failed to save: ${updateErr.message}`,
        });
      }
    }

    return NextResponse.json({
      success: !!result.email,
      email: result.email,
      error: result.error,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
