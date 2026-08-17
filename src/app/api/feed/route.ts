import { NextResponse } from "next/server";
import { getFeedProducts, getProductsByCategory } from "@/lib/queries";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const limit = Math.min(Number(searchParams.get("limit") ?? 40), 100);

  const products = category ? await getProductsByCategory(category, limit) : await getFeedProducts(limit);
  return NextResponse.json({ products });
}
