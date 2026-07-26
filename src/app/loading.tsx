import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-xs uppercase tracking-[0.2em]">Loading</p>
      </div>
    </main>
  );
}
