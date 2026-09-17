"use client";

import * as React from "react";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Star, Check, X, MessageSquare, ThumbsUp, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAdminRealtimeEvent } from "@/lib/realtime/use-admin-socket";

type Review = {
  id: string;
  productId: string;
  productName: string | null;
  author: string;
  rating: number;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  isVerified: boolean;
  isPublished: boolean;
  response?: string;
  date: string;
};

export function ReviewsSection() {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [respondingTo, setRespondingTo] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<Review | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews?status=all");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped: Review[] = (data.reviews ?? []).map((r: {
        id: string;
        product_id: string;
        product_name: string | null;
        author: string;
        rating: number;
        title: string | null;
        body: string | null;
        image_url: string | null;
        is_published: boolean;
        is_verified: boolean;
        public_response: string | null;
        created_at: string;
      }) => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        imageUrl: r.image_url,
        isVerified: r.is_verified,
        isPublished: r.is_published,
        response: r.public_response ?? undefined,
        date: r.created_at,
      }));
      setReviews(mapped);
    } catch (e) {
      toast.error("Failed to load reviews");
      console.error("load reviews failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Live update — a new review appears without waiting for a manual refresh.
  useAdminRealtimeEvent("review.created", () => {
    load();
  });

  const togglePublish = async (id: string) => {
    const current = reviews.find((r) => r.id === id);
    const next = !current?.isPublished;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, isPublished: next } : r)));
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(next ? "Review published" : "Review unpublished");
    } catch (e) {
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, isPublished: !next } : r)));
      toast.error("Failed to update review");
      console.error("togglePublish failed:", e);
    }
  };

  const submitResponse = async (id: string) => {
    if (!response.trim()) return;
    const previous = reviews;
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, response: response.trim() } : r)));
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_response: response.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Response published");
      setRespondingTo(null);
      setResponse("");
    } catch (e) {
      setReviews(previous);
      toast.error("Failed to publish response");
      console.error("submitResponse failed:", e);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReviews((rs) => rs.filter((r) => r.id !== pendingDelete.id));
      toast.success("Review deleted");
      setPendingDelete(null);
    } catch (e) {
      toast.error("Failed to delete review");
      console.error("delete review failed:", e);
    } finally {
      setDeleting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
      : "—";
  const published = reviews.filter((r) => r.isPublished).length;
  const pending = reviews.filter((r) => !r.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-display">{avgRating}</p>
          <p className="text-xs text-muted-foreground">Average rating</p>
        </Card>
        <Card className="p-4">
          <Check className="h-4 w-4 text-emerald-500 mb-2" />
          <p className="text-2xl font-display">{published}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </Card>
        <Card className="p-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground mb-2" />
          <p className="text-2xl font-display">{pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No reviews yet ✨</p>
            <p className="text-xs text-muted-foreground mt-1">
              Customer reviews will appear here once submitted.
            </p>
          </Card>
        ) : (
          reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs bg-foreground/5">
                    {r.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div>
                      <p className="text-sm font-medium">{r.author}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.productName ?? "Unknown product"} ·{" "}
                        {new Date(r.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i <= r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      {r.isVerified && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Check className="h-2.5 w-2.5 mr-0.5" /> Verified
                        </Badge>
                      )}
                      {!r.isPublished && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  {r.title && <p className="text-sm font-medium mt-2">{r.title}</p>}
                  {r.body && <p className="text-xs text-muted-foreground mt-1">{r.body}</p>}
                  {r.imageUrl && (
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden border border-border mt-2">
                      <Image src={r.imageUrl} alt="Review photo" fill sizes="80px" className="object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> Helpful
                    </span>
                  </div>

                  {r.response && (
                    <div className="mt-3 pl-4 border-l-2 border-foreground/20">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Response from MEME
                      </p>
                      <p className="text-xs">{r.response}</p>
                    </div>
                  )}

                  {respondingTo === r.id ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={2}
                        placeholder="Write a public response…"
                        className="text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitResponse(r.id)}>
                          Publish response
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRespondingTo(null);
                            setResponse("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(r.id);
                          setResponse(r.response ?? "");
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {r.response ? "Edit response" : "Respond"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => togglePublish(r.id)}>
                        {r.isPublished ? (
                          <>
                            <X className="h-3 w-3 mr-1" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" /> Publish
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
                        onClick={() => setPendingDelete(r)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the review by {pendingDelete?.author}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
