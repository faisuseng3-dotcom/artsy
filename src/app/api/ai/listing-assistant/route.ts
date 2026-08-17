import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/api-auth";
import { draftListing } from "@/lib/ai";

const bodySchema = z.object({
  categoryName: z.string().min(1),
  rawDescription: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tell us a bit about the piece first." }, { status: 400 });

  const draft = await draftListing(parsed.data);
  return NextResponse.json(draft);
}
