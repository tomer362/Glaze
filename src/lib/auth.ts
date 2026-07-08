import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { isAdminEmail } from "@/lib/permissions";

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
      // Expose the role so the UI/actions can gate admin-only editing.
      session.user.role = user.role;
      return session;
    },
  },
  events: {
    // Keep the `role` column in sync with the ADMIN_EMAILS allowlist on every
    // sign-in. This lets admins be managed entirely from the Vercel dashboard
    // (edit the env var + redeploy) with no terminal or DB console — the user
    // row exists by the time this fires, so we can just stamp the right role.
    async signIn({ user }) {
      if (!user.id || !user.email) return;
      const shouldBeAdmin = isAdminEmail(user.email);
      const nextRole = shouldBeAdmin ? "admin" : "user";
      if (user.role !== nextRole) {
        await db
          .update(users)
          .set({ role: nextRole })
          .where(eq(users.id, user.id));
      }
    },
  },
});
