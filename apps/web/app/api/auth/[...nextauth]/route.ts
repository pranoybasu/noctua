import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

async function wrappedHandler(req: NextRequest, ctx: any) {
  try {
    return await handler(req, ctx);
  } catch (err) {
    console.error("[NextAuth] Unhandled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
