import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { verifyEmail } from "@/lib/enrichment/millionverifier";

export async function POST(request: NextRequest) {
  try {
    const { rowId, email } = await request.json();

    if (!rowId || !email) {
      return NextResponse.json(
        { error: "rowId and email are required" },
        { status: 400 }
      );
    }

    const result = await verifyEmail(email);

    // Update row in Supabase
    const { data: row } = await supabaseServer
      .from("list_rows")
      .select("data, flags")
      .eq("id", rowId)
      .single();

    if (row) {
      const updatedFlags = { ...row.flags };

      // Set email verification flag
      if (result.isRoleAccount) {
        updatedFlags["Email"] = "role_account";
      } else {
        updatedFlags["Email"] = result.status;
      }

      await supabaseServer
        .from("list_rows")
        .update({ flags: updatedFlags })
        .eq("id", rowId);
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
