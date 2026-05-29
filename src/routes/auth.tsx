import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — FoodLink" },
      { name: "description", content: "Sign in or create an account on FoodLink to donate, receive, or deliver food." },
    ],
  }),
});

type Role = "donor" | "ngo" | "volunteer";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // signup state
  const [role, setRole] = useState<Role>("donor");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [phone, setPhone] = useState("");
  const [emailUp, setEmailUp] = useState("");
  const [passUp, setPassUp] = useState("");

  // signin state
  const [emailIn, setEmailIn] = useState("");
  const [passIn, setPassIn] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: emailUp,
      password: passUp,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: name, role, phone, organization_name: org },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your inbox to verify your email.");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailIn, password: passIn });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/app" });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (res.error) {
      setBusy(false);
      toast.error("Google sign-in failed");
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-leaf to-leaf/80 p-12 text-paper md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 grain opacity-20" />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-paper text-leaf">
            <Heart className="h-4 w-4 fill-leaf" />
          </span>
          <span className="font-serif text-2xl">FoodLink</span>
        </Link>
        <div className="relative">
          <h1 className="font-serif text-5xl leading-tight">Connecting Food with Hope.</h1>
          <p className="mt-4 max-w-md text-paper/80">Join thousands of donors, NGOs and volunteers turning surplus food into served meals — in real time.</p>
        </div>
        <div className="relative text-sm text-paper/70">© FoodLink 2026</div>
      </div>

      {/* Right — form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back home
          </Link>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6 space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={emailIn} onChange={(e) => setEmailIn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required value={passIn} onChange={(e) => setPassIn(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Sign in</Button>
              </form>
              <Divider />
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donor">Donor (restaurant, hotel, hall, household)</SelectItem>
                      <SelectItem value="ngo">NGO / charity</SelectItem>
                      <SelectItem value="volunteer">Volunteer (delivery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                {role === "ngo" && (
                  <div className="space-y-2">
                    <Label>Organization name</Label>
                    <Input required value={org} onChange={(e) => setOrg(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" required value={emailUp} onChange={(e) => setEmailUp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required minLength={6} value={passUp} onChange={(e) => setPassUp(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>Create account</Button>
              </form>
              <Divider />
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}