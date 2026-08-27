import { type NextRequest } from "next/server";
import { gateRequest } from "@/lib/auth/middleware";

export async function middleware(request: NextRequest) {
  return await gateRequest(request);
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*"],
};
