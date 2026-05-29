import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notif")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf">Inbox</div>
        <h1 className="mt-2 font-serif text-4xl">Notifications</h1>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-card">
        {items && items.length > 0 ? (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 p-4">
                <Bell className="mt-0.5 h-4 w-4 text-leaf" />
                <div>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-muted-foreground">{n.message}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-sm text-muted-foreground">You're all caught up.</div>
        )}
      </div>
    </div>
  );
}