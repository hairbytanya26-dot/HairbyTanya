import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureSlotsGenerated } from "@/lib/autoGenerateSlots";

export async function POST() {
  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  await ensureSlotsGenerated();
  return NextResponse.json({ success: true });
}
