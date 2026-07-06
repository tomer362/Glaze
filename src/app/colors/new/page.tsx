import { auth } from "@/lib/auth";
import { ColorForm } from "@/components/ColorForm";
import { SignInCard } from "@/components/SignInCard";

export default async function NewColorPage() {
  const session = await auth();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">הוספת צבע גלזורה</h1>
        <p className="mt-1 text-sm text-muted">
          העלו צבע משלכם עם תמונה של הגלזורה השרופה — הוא יופיע לכולם כאפשרות בערבובים.
        </p>
      </div>

      {session?.user ? (
        <ColorForm />
      ) : (
        <SignInCard message="כדי להוסיף צבע חדש צריך להתחבר." />
      )}
    </div>
  );
}
