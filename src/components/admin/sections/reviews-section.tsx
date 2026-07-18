"use client";

import * as React from "react";
import { Star, Check, X, MessageSquare, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { reviews as seedReviews, getReviewsForProduct, products as seedProducts } from "@/data/products";
import { toast } from "sonner";

type Review = (typeof seedReviews)[number] & {
  response?: string;
  is_published?: boolean;
};

export function ReviewsSection() {
  const [reviews, setReviews] = React.useState<Review[]>(
    seedReviews.map((r) => ({ ...r, is_published: true }))
  );
  const [respondingTo, setRespondingTo] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState("");

  const togglePublish = (id: string) => {
    setReviews((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, is_published: !r.is_published } : r
      )
    );
    toast.success("Review status updated");
  };

  const submitResponse = (id: string) => {
    if (!response.trim()) return;
    setReviews((rs) =>
      rs.map((r) => (r.id === id ? { ...r, response: response.trim() } : r))
    );
    setRespondingTo(null);
    setResponse("");
    toast.success("Response published");
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
      : "—";
  const published = reviews.filter((r) => r.is_published).length;
  const pending = reviews.filter((r) => !r.is_published).length;

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
        {reviews.map((r) => {
          const product = seedProducts.find((p) => p.id === r.productId);
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs bg-foreground/5">
                    {r.author.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-medium">{r.author}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {product?.name ?? "Unknown product"} ·{" "}
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
                      {r.verified && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Check className="h-2.5 w-2.5 mr-0.5" /> Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium mt-2">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.body}</p>
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {r.helpful} helpful
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
                        <Button
                          size="sm"
                          onClick={() => submitResponse(r.id)}
                        >
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
                    <div className="flex gap-2 mt-3">
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublish(r.id)}
                      >
                        {r.is_published ? (
                          <>
                            <X className="h-3 w-3 mr-1" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" /> Publish
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
