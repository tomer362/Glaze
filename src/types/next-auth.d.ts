import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  // The `user` passed to the signIn event carries the DB role column.
  interface User {
    role?: string;
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    role: string;
  }
}
