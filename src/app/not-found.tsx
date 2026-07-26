import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="font-display text-[120px] leading-none tracking-tighter text-foreground/15">
          404
        </p>
        <div className="space-y-2 -mt-4">
          <h1 className="font-display text-3xl tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you’re looking for may have been moved or no longer exists.
            Let’s get you back to the atelier.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/shop">Browse shop</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
