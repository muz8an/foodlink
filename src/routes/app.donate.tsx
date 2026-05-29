import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/donate")({
  component: DonatePage,
});

function DonatePage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [foodName, setFoodName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [foodType, setFoodType] = useState("veg");
  const [expiry, setExpiry] = useState("");
  const [addr, setAddr] = useState("");
  const [phone, setPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: myDonations } = useQuery({
    queryKey: ["my-donations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*")
        .eq("donor_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Could not get location"),
    );
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      let imageUrl: string | null = null;
      if (imageFile) {
        const path = `${user.id}/${Date.now()}-${imageFile.name}`;
        const { error: upErr } = await supabase.storage.from("food-images").upload(path, imageFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from("food-images").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("donations").insert({
        donor_id: user.id,
        food_name: foodName,
        description,
        quantity,
        food_type: foodType as any,
        expiry_time: new Date(expiry).toISOString(),
        pickup_address: addr,
        contact_phone: phone,
        latitude: coords?.lat,
        longitude: coords?.lng,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Donation posted — NGOs nearby will be notified.");
      setFoodName(""); setDescription(""); setQuantity(""); setExpiry(""); setAddr(""); setPhone(""); setCoords(null); setImageFile(null);
      qc.invalidateQueries({ queryKey: ["my-donations"] });
      qc.invalidateQueries({ queryKey: ["recent-donations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelDonation = async (id: string) => {
    const { error } = await supabase.from("donations").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cancelled");
    qc.invalidateQueries({ queryKey: ["my-donations"] });
  };

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf">New donation</div>
        <h1 className="mt-2 font-serif text-4xl">Share surplus food</h1>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
        className="grid gap-5 rounded-2xl border bg-card p-6 shadow-soft md:grid-cols-2"
      >
        <div className="space-y-2 md:col-span-2">
          <Label>Food item</Label>
          <Input required placeholder="e.g. Veg biryani" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description (optional)</Label>
          <Textarea placeholder="Any details — packaging, allergens, storage notes" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input required placeholder="e.g. 20 plates / 5 kg" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Food type</Label>
          <Select value={foodType} onValueChange={setFoodType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="veg">Vegetarian</SelectItem>
              <SelectItem value="non_veg">Non-vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Best before</Label>
          <Input type="datetime-local" required value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contact phone</Label>
          <Input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Pickup address</Label>
          <div className="flex gap-2">
            <Input required value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Street, area, city" />
            <Button type="button" variant="outline" onClick={getLocation}>
              <MapPin className="mr-1 h-4 w-4" /> {coords ? "Captured" : "Use my location"}
            </Button>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Photo</Label>
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" size="lg" className="w-full md:w-auto" disabled={submit.isPending}>
            <Upload className="mr-2 h-4 w-4" /> {submit.isPending ? "Posting…" : "Post donation"}
          </Button>
        </div>
      </form>

      <section>
        <h2 className="mb-4 font-serif text-2xl">My donations</h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {myDonations && myDonations.length > 0 ? (
            <ul className="divide-y">
              {myDonations.map((d) => (
                <li key={d.id} className="flex items-center gap-4 p-4">
                  {d.image_url && <img src={d.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.food_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{d.quantity} · {new Date(d.created_at).toLocaleString()}</div>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs capitalize">{d.status}</span>
                  {d.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => cancelDonation(d.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">No donations yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}