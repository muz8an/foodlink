import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Navigation, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/deliveries")({
  component: DeliveriesPage,
});

function DeliveriesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: unassigned } = useQuery({
    queryKey: ["unassigned-deliveries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("*, donations(*)")
        .is("volunteer_id", null);
      return data ?? [];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["my-deliveries", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("*, donations(*)")
        .eq("volunteer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const claim = async (id: string) => {
    const { error } = await supabase.from("deliveries").update({ volunteer_id: user!.id, status: "en_route_pickup" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Claimed");
    qc.invalidateQueries({ queryKey: ["unassigned-deliveries"] });
    qc.invalidateQueries({ queryKey: ["my-deliveries"] });
  };

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf">Volunteer</div>
        <h1 className="mt-2 font-serif text-4xl">Pickups & deliveries</h1>
      </header>

      <section>
        <h2 className="mb-4 font-serif text-2xl">Available pickups</h2>
        {unassigned && unassigned.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {unassigned.map((d: any) => (
              <div key={d.id} className="rounded-2xl border bg-card p-5">
                <h3 className="font-serif text-lg">{d.donations?.food_name}</h3>
                <div className="text-sm text-muted-foreground">{d.donations?.pickup_address}</div>
                <Button className="mt-4 w-full" onClick={() => claim(d.id)}>Claim pickup</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">No pickups waiting.</div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl">My deliveries</h2>
        {mine && mine.length > 0 ? (
          <div className="space-y-3">
            {mine.map((d: any) => <DeliveryCard key={d.id} delivery={d} />)}
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">Nothing assigned yet.</div>
        )}
      </section>
    </div>
  );
}

function DeliveryCard({ delivery }: { delivery: any }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [proof, setProof] = useState<File | null>(null);

  const updateStatus = async (status: any, extra: Record<string, any> = {}) => {
    const { error } = await supabase.from("deliveries").update({ status, ...extra }).eq("id", delivery.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-deliveries"] });
  };

  const confirmPickup = async () => {
    await updateStatus("picked_up", { pickup_at: new Date().toISOString() });
    await supabase.from("donations").update({ status: "picked_up" }).eq("id", delivery.donation_id);
    toast.success("Pickup confirmed");
  };

  const confirmDelivery = async () => {
    let proofUrl: string | null = null;
    if (proof && user) {
      const path = `${user.id}/${Date.now()}-${proof.name}`;
      const { error } = await supabase.storage.from("delivery-proof").upload(path, proof);
      if (error) return toast.error(error.message);
      proofUrl = supabase.storage.from("delivery-proof").getPublicUrl(path).data.publicUrl;
    }
    await updateStatus("delivered", { delivered_at: new Date().toISOString(), proof_image_url: proofUrl });
    await supabase.from("donations").update({ status: "delivered", completed_at: new Date().toISOString() }).eq("id", delivery.donation_id);
    toast.success("Delivered — thank you!");
  };

  const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.donations?.pickup_address ?? "")}`;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg">{delivery.donations?.food_name}</h3>
          <div className="text-sm text-muted-foreground">{delivery.donations?.pickup_address}</div>
        </div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{delivery.status.replace(/_/g, " ")}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={mapUrl} target="_blank" rel="noreferrer"><Navigation className="mr-1 h-4 w-4" /> Navigate</a>
        </Button>
        {delivery.status === "en_route_pickup" && (
          <Button size="sm" onClick={confirmPickup}><Check className="mr-1 h-4 w-4" /> Confirm pickup</Button>
        )}
        {delivery.status === "picked_up" && (
          <>
            <Input type="file" accept="image/*" className="w-auto" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
            <Button size="sm" onClick={confirmDelivery}><Upload className="mr-1 h-4 w-4" /> Confirm delivery</Button>
          </>
        )}
      </div>
    </div>
  );
}