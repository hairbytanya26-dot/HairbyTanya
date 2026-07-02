import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { author_name, rating, body } = await request.json();

    if (!author_name || typeof author_name !== "string" || !author_name.trim()) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Please write a review." }, { status: 400 });
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Please select a rating between 1 and 5." }, { status: 400 });
    }
    if (author_name.length > 100 || body.length > 1000) {
      return NextResponse.json({ error: "That's a bit long — please shorten it." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("reviews").insert({
      author_name: author_name.trim(),
      rating: ratingNum,
      body: body.trim(),
      is_featured: true,
      sort_order: 0,
    });

    if (error) {
      console.error("review insert error", error);
      return NextResponse.json({ error: "Could not submit your review. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("reviews route error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
