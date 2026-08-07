"use client";

import * as React from "react";
import { Trash2, Plus, Loader2, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAdminEmailClient, SUPER_ADMIN_EMAIL } from "@/lib/auth/simple-auth";

type AllowedEmail = {
  id: string;
  email: string;
  added_by: string | null;
  created_at: string;
};

export function AdminAccessSection() {
  const [emails, setEmails] = React.useState<AllowedEmail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const currentAdminEmail = getAdminEmailClient() ?? "";
  const isSuperAdmin = currentAdminEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const fetchEmails = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/allowed-emails");
      const data = await res.json();
      if (data.ok) setEmails(data.emails);
    } catch {
      toast.error("Failed to load allowed emails");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      toast.success(`${newEmail} added to admin whitelist`);
      setNewEmail("");
      fetchEmails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add email");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, email: string) => {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/admin/allowed-emails/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed");
      toast.success(`${email} removed`);
      setEmails((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Admin Access</h2>
        <p className="text-sm text-muted-foreground">
          Control which Gmail accounts can access the admin panel.
          {!isSuperAdmin && (
            <span className="ml-1 text-amber-500">Only {SUPER_ADMIN_EMAIL} can modify this list.</span>
          )}
        </p>
      </div>

      {/* Add email form — super-admin only */}
      {isSuperAdmin && (
        <form onSubmit={handleAdd} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="user@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </form>
      )}

      {/* Email list */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Authorized Emails ({emails.length})
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : emails.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No authorized emails</div>
        ) : (
          <ul className="divide-y divide-border">
            {emails.map((entry) => {
              const isSelf = entry.email.toLowerCase() === currentAdminEmail.toLowerCase();
              const isDefaultAdmin = entry.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
              return (
                <li key={entry.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {entry.email}
                        {isDefaultAdmin && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Super Admin
                          </span>
                        )}
                        {isSelf && !isDefaultAdmin && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(entry.created_at).toLocaleDateString()}
                        {entry.added_by && ` by ${entry.added_by}`}
                      </p>
                    </div>
                  </div>

                  {isSuperAdmin && !isDefaultAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 h-8 w-8"
                      onClick={() => handleRemove(entry.id, entry.email)}
                      disabled={removingId === entry.id}
                    >
                      {removingId === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
