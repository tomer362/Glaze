import { Spinner } from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-muted">
      <Spinner className="h-6 w-6" />
      טוען ערבובים…
    </div>
  );
}
