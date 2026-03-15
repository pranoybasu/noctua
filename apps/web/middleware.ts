import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "noctua-demo-deployment-secret-2026",
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
