import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  session: { strategy: "database" },
  // Auth.js auto-trusts the host on Vercel; be explicit so it also works
  // behind other proxies / preview URLs.
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      // Expose the DB user id to the app (used to stamp ownership).
      session.user.id = user.id;
      return session;
    },
  },
});
