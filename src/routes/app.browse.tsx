import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/browse")({
  component: BrowsePage,
});

function BrowsePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: donations } = useQuery({
    queryKey: ["browse-donations", filter],
    queryFn: async () => {
      let q = supabase.from("donations").select("*").eq("status", "pending").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("food_type", filter as any);
      const { data } = await q;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("donations-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => {
        qc.invalidateQueries({ queryKey: ["browse-donations"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const accept = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("donations")
      .update({ status: "accepted", ngo_id: user.id, accepted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("deliveries").insert({ donation_id: id, ngo_id: user.id });
    toast.success("Donation accepted — assigning volunteer");
    qc.invalidateQueries({ queryKey: ["browse-donations"] });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-leaf">Live feed</div>
          <h1 className="mt-2 font-serif text-4xl">Available food nearby</h1>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="veg">Vegetarian</SelectItem>
            <SelectItem value="non_veg">Non-veg</SelectItem>
            <SelectItem value="vegan">Vegan</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {donations && donations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {donations.map((d) => (
            <article key={d.id} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
              {d.image_url && <img src={d.image_url} alt={d.food_name} className="h-44 w-full object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl">{d.food_name}</h3>
                  <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-xs capitalize text-leaf">{d.food_type.replace("_", "-")}</span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{d.quantity}</div>
                {d.description && <p className="mt-2 text-sm">{d.description}</p>}
                <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {d.pickup_address}</div>
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> Best by {new Date(d.expiry_time).toLocaleString()}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {d.contact_phone}</div>
                </dl>
                <Button className="mt-5 w-full" onClick={() => accept(d.id)}>
                  <Check className="mr-2 h-4 w-4" /> Accept donation
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
          No donations available right now. New ones appear instantly.
        </div>
      )}
    </div>
  );
}