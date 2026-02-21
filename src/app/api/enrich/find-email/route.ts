import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { findEmail } from "@/lib/enrichment/icypeas";

export async function POST(request: NextRequest) {
  try {
    const { rowId, firstName, lastName, domain } = await request.json();

    if (!rowId || !firstName || !lastName || !domain) {
      return NextResponse.json(
        { error: "rowId, firstName, lastName, and domain are required" },
        { status: 400 }
      );
    }

    const result = await findEmail(firstName, lastName, domain);

    if (result.email) {
      // Update row in Supabase
      const { data: row } = await supabaseServer
        .from("list_rows")
        .select("data, flags")
        .eq("id", rowId)
        .single();

      if (row) {
        const updatedData = { ...row.data };
        const updatedFlags = { ...row.flags };

        updatedData["Email"] = result.email;
        updatedFlags["Email"] = "enriched";

        await supabaseServer
          .from("list_rows")
          .update({ data: updatedData, flags: updatedFlags })
          .eq("id", rowId);
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
