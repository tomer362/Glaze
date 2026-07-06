import { signIn } from "@/lib/auth";

export function SignInCard({ message }: { message: string }) {
  return (
    <div className="card mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-muted">{message}</p>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
        >
          התחברות עם Google
        </button>
      </form>
    </div>
  );
}
