import type { Session } from "next-auth";

/**
 * Authorization helpers. OAuth (Google) only tells us *who* a user is; being an
 * admin is a separate concern we manage ourselves. The list of admin emails
 * lives in the ADMIN_EMAILS env var (comma-separated) so it can be managed from
 * the Vercel dashboard, and it's mirrored onto users.role on each sign-in.
 */

/** True if the email is in the ADMIN_EMAILS allowlist (case/space-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

/** True if the signed-in user is an admin (role synced from ADMIN_EMAILS). */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "admin";
}

type Ownable = { createdBy: string | null };

/** Admins may edit anything; otherwise only the creator of the row. */
export function canEdit(session: Session | null, row: Ownable): boolean {
  if (isAdmin(session)) return true;
  const uid = session?.user?.id;
  return !!uid && row.createdBy === uid;
}

// Named aliases for readability at call sites.
export const canEditColor = canEdit;
export const canEditMixture = canEdit;
