import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Heart, Home, Upload, Search, Truck, Bell, User, LogOut, Languages, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, primaryRole, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, setLang, t } = useT();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }

  const nav = [
    { to: "/app", icon: Home, label: t("nav.dashboard"), show: true, exact: true },
    { to: "/app/donate", icon: Upload, label: t("nav.donate"), show: primaryRole === "donor" || primaryRole === "admin" },
    { to: "/app/browse", icon: Search, label: t("nav.browse"), show: primaryRole === "ngo" || primaryRole === "admin" },
    { to: "/app/deliveries", icon: Truck, label: t("nav.deliveries"), show: primaryRole === "volunteer" || primaryRole === "admin" },
    { to: "/app/emergency", icon: Siren, label: t("nav.emergency"), show: true },
    { to: "/app/notifications", icon: Bell, label: t("nav.notifications"), show: true },
    { to: "/app/profile", icon: User, label: t("nav.profile"), show: true },
  ].filter((n) => n.show);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-card/50 p-4 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf to-ember text-paper">
            <Heart className="h-4 w-4 fill-paper" />
          </span>
          <span className="font-serif text-2xl">FoodLink</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-leaf text-paper" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center gap-2 px-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select value={lang} onValueChange={(v) => setLang(v as "en" | "hi" | "kn")}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-accent/50 px-3 py-2 text-xs">
            <div className="truncate font-medium">{profile?.full_name ?? user.email}</div>
            <div className="mt-0.5 text-muted-foreground capitalize">{primaryRole ?? "member"}</div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> {t("nav.signout")}
          </Button>
        </div>
      </aside>

      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl px-5 py-8 pb-24 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px]",
                active ? "text-leaf" : "text-muted-foreground",
              )}
            >
              <n.icon className="h-5 w-5" />
              <span>{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}