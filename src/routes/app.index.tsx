import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Upload, Search, Truck, Siren, Package, Heart, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { profile, primaryRole, user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const [donations, emergencies, deliveries] = await Promise.all([
        supabase.from("donations").select("id,status", { count: "exact", head: false }),
        supabase.from("emergency_requests").select("id", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("deliveries").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      ]);
      const total = donations.data?.length ?? 0;
      const pending = donations.data?.filter((d) => d.status === "pending").length ?? 0;
      return {
        total,
        pending,
        emergencies: emergencies.count ?? 0,
        delivered: deliveries.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-donations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const quickActions: Record<string, { icon: any; label: string; to: string; desc: string }[]> = {
    donor: [
      { icon: Upload, label: "Post donation", to: "/app/donate", desc: "Share surplus food now" },
      { icon: Package, label: "My donations", to: "/app/donate", desc: "Track & cancel" },
    ],
    ngo: [
      { icon: Search, label: "Browse food", to: "/app/browse", desc: "See nearby donations" },
      { icon: Siren, label: "Raise alert", to: "/app/emergency", desc: "Emergency request" },
    ],
    volunteer: [
      { icon: Truck, label: "My pickups", to: "/app/deliveries", desc: "Assigned & active" },
    ],
    admin: [
      { icon: Users, label: "Manage users", to: "/app/profile", desc: "Approve & monitor" },
    ],
  };

  const actions = quickActions[primaryRole ?? "donor"] ?? [];

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf">
          {primaryRole ?? "member"} dashboard
        </div>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">
          Welcome, {profile?.full_name?.split(" ")[0] ?? "friend"}.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every meal saved is a meal served. Here's what's happening right now.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="Active donations" value={stats?.total ?? 0} />
        <StatCard icon={Heart} label="Awaiting pickup" value={stats?.pending ?? 0} accent />
        <StatCard icon={Siren} label="Open emergencies" value={stats?.emergencies ?? 0} />
        <StatCard icon={TrendingUp} label="Delivered" value={stats?.delivered ?? 0} />
      </section>

      {actions.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl">Quick actions</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {actions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf/10 text-leaf">
                  <a.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="font-serif text-xl">{a.label}</div>
                  <div className="text-sm text-muted-foreground">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl">Recent activity</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {recent && recent.length > 0 ? (
            <ul className="divide-y">
              {recent.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{d.food_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {d.quantity} · {d.pickup_address}
                    </div>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{d.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No donations yet. {primaryRole === "donor" && <Link to="/app/donate" className="text-leaf underline">Post the first one →</Link>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${accent ? "border-ember/40" : ""}`}>
      <Icon className={`h-5 w-5 ${accent ? "text-ember" : "text-leaf"}`} />
      <div className="mt-3 font-serif text-3xl">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}