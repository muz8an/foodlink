import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Siren, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/emergency")({
  component: EmergencyPage,
});

function EmergencyPage() {
  const { user, primaryRole } = useAuth();
  const qc = useQueryClient();
  const isNgo = primaryRole === "ngo" || primaryRole === "admin";

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [people, setPeople] = useState("");
  const [addr, setAddr] = useState("");

  const { data: alerts } = useQuery({
    queryKey: ["emergencies"],
    queryFn: async () => {
      const { data } = await supabase.from("emergency_requests").select("*").eq("resolved", false).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("emergency_requests").insert({
        ngo_id: user.id, title, description: desc, urgency: urgency as any,
        people_count: people ? parseInt(people) : null, address: addr,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Emergency alert broadcast.");
      setTitle(""); setDesc(""); setPeople(""); setAddr("");
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-ember">Hunger alert</div>
        <h1 className="mt-2 font-serif text-4xl">Emergency food requests</h1>
      </header>

      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-ember/40 bg-ember/5 p-5">
              <div className="flex items-start gap-3">
                <Siren className="mt-1 h-5 w-5 text-ember" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl">{a.title}</h3>
                    <span className="rounded-full bg-ember px-2 py-0.5 text-xs uppercase text-ember-foreground">{a.urgency}</span>
                  </div>
                  <p className="mt-1 text-sm">{a.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.address}</span>
                    {a.people_count && <span>{a.people_count} people</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isNgo && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft md:grid-cols-2"
        >
          <h2 className="font-serif text-2xl md:col-span-2">Raise a hunger alert</h2>
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Urgent need at shelter" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Details</Label>
            <Textarea required value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>People to feed</Label>
            <Input type="number" value={people} onChange={(e) => setPeople(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Location</Label>
            <Input required value={addr} onChange={(e) => setAddr(e.target.value)} />
          </div>
          <Button type="submit" className="md:col-span-2" disabled={create.isPending}>
            <Siren className="mr-2 h-4 w-4" /> Broadcast alert
          </Button>
        </form>
      )}
    </div>
  );
}