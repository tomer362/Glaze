import Link from "next/link";
import Image from "next/image";
import { auth, signIn, signOut } from "@/lib/auth";

const navItems = [
  { href: "/colors", label: "צבעים" },
  { href: "/mixtures", label: "ערבובים" },
  { href: "/search", label: "חיפוש" },
];

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-full"
            style={{
              background:
                "conic-gradient(from 210deg, #b5510f, #e0a44b, #2f6f6a, #4a6f9a, #b5510f)",
            }}
          />
          <span>
            mix <span className="text-primary">&amp;</span> fire
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2 sm:text-base">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-1.5 text-muted transition hover:bg-background hover:text-foreground sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/mixtures/new"
                className="hidden rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:inline-block"
              >
                + ערבוב חדש
              </Link>
              {user.image && (
                <Image
                  src={user.image}
                  alt={user.name ?? "משתמש"}
                  width={32}
                  height={32}
                  className="rounded-full border border-border"
                />
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg px-2 py-1.5 text-sm text-muted transition hover:text-foreground"
                >
                  יציאה
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                התחברות עם Google
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
