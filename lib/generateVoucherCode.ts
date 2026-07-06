import { createAdminClient } from "@/lib/supabase/admin";

// Avoids visually ambiguous characters (0/O, 1/I/L) so codes are easy to
// read aloud or type in correctly.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

export async function generateUniqueVoucherCode(): Promise<string> {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `HBT-${randomSegment(4)}-${randomSegment(4)}`;
    const { data } = await supabase
      .from("gift_vouchers")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  throw new Error("Could not generate a unique voucher code after several attempts.");
}
