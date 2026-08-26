import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/api/products");
  revalidateTag("products");
  return NextResponse.json({ revalidated: true, time: Date.now() });
}
