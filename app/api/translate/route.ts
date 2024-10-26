import { BRIAN_URL } from "@/config/Brian";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const res = await fetch(`${BRIAN_URL}`, {
    method: "POST",
    body: prompt,
  });
  const response = await res.json();

  return NextResponse.json({ data: response });
}
