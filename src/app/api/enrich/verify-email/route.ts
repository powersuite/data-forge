import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { verifyEmail } from "@/lib/enrichment/millionverifier";

export async function POST(request: NextRequest) {
  try {
    const { rowId, email, columnNames } = await request.json();

    if (!rowId || !email) {
      return NextResponse.json(
        { success: false, error: "rowId and email are required" },
        { status: 400 }
      );
    }

    const emailCol = columnNames?.emailCol ?? "email";

    const result = await verifyEmail(email);

    // Update row in Supabase
    const { data: row, error: fetchErr } = await supabaseServer
      .from("list_rows")
      .select("data, flags")
      .eq("id", rowId)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({
        success: false,
        error: `Verified email but failed to fetch row: ${fetchErr?.message ?? "row not found"}`,
      });
    }

    const updatedFlags = { ...row.flags };

    // Set email verification flag
    if (result.isRoleAccount) {
      updatedFlags[emailCol] = "role_account";
    } else {
      updatedFlags[emailCol] = result.status;
    }

    const { error: updateErr } = await supabaseServer
      .from("list_rows")
      .update({ flags: updatedFlags })
      .eq("id", rowId);

    if (updateErr) {
      return NextResponse.json({
        success: false,
        error: `Verified email but failed to save flag: ${updateErr.message}`,
      });
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      isRoleAccount: result.isRoleAccount,
      error: result.error,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
