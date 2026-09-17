"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Review = {
  id: string;
  author: string;
  rating: number;
  title: string | null;
  body: string | null;
  image_url: string | null;
  is_verified: boolean;
  created_at: string;
  response: string | null;
  response_at: string | null;
};

function StarRow({ rating, size = "h-3.5 w-3.5" }: { rating: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= rating ? "fill-foreground text-foreground" : "text-muted-foreground")}
        />
      ))}
    </div>
  );
}

/**
 * Real product reviews — fetched from /api/reviews (backed by Postgres),
 * with a submit form that works whether or not the visitor is logged in.
 * Logged-in visitors are attributed by name (and marked Verified if they
 * bought this product); anonymous visitors show as "Anonymous". New
 * reviews are pending admin approval, so they don't appear in the list
 * immediately — the form says so.
 */
export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [avgRating, setAvgRating] = React.useState<number | null>(null);
  const [count, setCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setAvgRating(data.avgRating ?? null);
      setCount(data.count ?? 0);
    } catch {
      // leave list empty on failure
    } finally {
      setLoading(false);
    }
  }, [productId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        {avgRating !== null && (
          <>
            <StarRow rating={Math.round(avgRating)} size="h-4 w-4" />
            <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({count} review{count === 1 ? "" : "s"})</span>
          </>
        )}
      </div>

      <WriteReviewForm productId={productId} onSubmitted={load} />

      <div className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-b border-border/60 pb-6">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <p className="font-medium text-sm">{r.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <StarRow rating={r.rating} />
              </div>
              {r.title && <p className="font-medium text-sm mb-1">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>}
              {r.image_url && (
                <div className="relative w-24 h-28 rounded-lg overflow-hidden border border-border mt-3">
                  <Image src={r.image_url} alt="Review photo" fill sizes="96px" className="object-cover" />
                </div>
              )}
              {r.is_verified && (
                <Badge variant="outline" className="mt-2 text-[10px]">Verified buyer</Badge>
              )}
              {r.response && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-amber-500/40 text-xs">
                  <p className="font-medium text-foreground mb-0.5">Response from MEME</p>
                  <p className="text-muted-foreground leading-relaxed">{r.response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WriteReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/reviews/image-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data.error || "Failed to upload photo");
        return;
      }
      setImageUrl(data.url);
    } catch {
      toast.error("Network error while uploading photo");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (body.trim().length < 10) {
      toast.error("Please write at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
          image_url: imageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }
      toast.success("Thanks! Your review will appear after a quick review by our team.");
      setTitle("");
      setBody("");
      setImageUrl(null);
      setRating(5);
      setOpen(false);
      onSubmitted();
    } catch {
      toast.error("Network error while submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="rounded-full">
        Write a review
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-2xl p-5 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">Write a review</p>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                i <= (hoverRating || rating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Review title (optional)"
        maxLength={120}
        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
      />

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience with this product…"
        maxLength={2000}
        rows={4}
        className="text-sm"
      />

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = "";
          }}
        />
        {imageUrl ? (
          <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-border">
            <Image src={imageUrl} alt="Review photo" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full"
          >
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" /> Add a photo</>
            )}
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Not signed in? Your review will be posted as Anonymous. Sign in to have it show your name.
      </p>

      <Button onClick={submit} disabled={submitting} className="rounded-full h-11 w-full font-bold">
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </div>
  );
}
