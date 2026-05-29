import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, primaryRole, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [org, setOrg] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setOrg(profile.organization_name ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone, address, organization_name: org })
      .eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    await refreshProfile();
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf">{primaryRole}</div>
        <h1 className="mt-2 font-serif text-4xl">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
      </header>

      <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-soft md:grid-cols-2">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {primaryRole === "ngo" && (
          <div className="space-y-2 md:col-span-2">
            <Label>Organization name</Label>
            <Input value={org} onChange={(e) => setOrg(e.target.value)} />
          </div>
        )}
        <div className="space-y-2 md:col-span-2">
          <Label>Address</Label>
          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex gap-2 md:col-span-2">
          <Button onClick={save}>Save changes</Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}