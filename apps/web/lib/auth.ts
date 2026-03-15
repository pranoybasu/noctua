import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseAdmin } from "./supabase";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Demo",
    credentials: {},
    async authorize() {
      return {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@noctua.dev",
        image: "https://avatars.githubusercontent.com/u/10137?v=4",
      };
    },
  }),
];

if (!DEMO_MODE && process.env.GITHUB_CLIENT_ID) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user repo" } },
    })
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "noctua-demo-deployment-secret-2026",
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (user && account?.provider === "credentials") {
        token.userId = "demo-user-id";
        token.accessToken = "demo-token";
        token.login = "demo-user";
        token.githubId = "0";
        return token;
      }

      if (account && profile) {
        token.accessToken = account.access_token;
        const ghProfile = profile as Record<string, unknown>;
        token.githubId = String(ghProfile.id);
        token.login = ghProfile.login as string;

        const { data } = await supabaseAdmin
          .from("users")
          .upsert(
            {
              github_id: String(ghProfile.id),
              login: ghProfile.login as string,
              name: (ghProfile.name as string) ?? null,
              email: (ghProfile.email as string) ?? null,
              avatar_url: (ghProfile.avatar_url as string) ?? null,
            },
            { onConflict: "github_id" }
          )
          .select("id")
          .single();

        if (data) token.userId = data.id;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        userId: token.userId as string,
        accessToken: token.accessToken as string,
        login: token.login as string,
      };
    },
  },
  pages: {
    signIn: "/login",
  },
};

declare module "next-auth" {
  interface Session {
    userId: string;
    accessToken: string;
    login: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    githubId?: string;
    login?: string;
  }
}
