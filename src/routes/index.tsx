import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Heart, MapPin, Bell, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "FoodLink — Connecting Food with Hope" },
      { name: "description", content: "A live food-rescue network that links restaurants, hotels, halls and households with NGOs and volunteers in real time." },
    ],
  }),
});

function Index() {
  const { t } = useT();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Nav */}
      <header className="border-b border-border/60 bg-paper/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-leaf to-ember text-paper">
              <Heart className="h-4 w-4 fill-paper" />
            </span>
            <span className="font-serif text-2xl leading-none">FoodLink</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="default">
                <Link to="/app">{t("nav.dashboard")} <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost"><Link to="/auth">{t("nav.signin")}</Link></Button>
                <Button asChild><Link to="/auth">Get started</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 grain opacity-40" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf/5 px-3 py-1 text-xs font-medium text-leaf">
              <Sparkles className="h-3 w-3" /> {t("tagline")}
            </div>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-balance md:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t("hero.sub")}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/auth">{t("hero.cta.donor")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 border-ember text-ember hover:bg-ember hover:text-ember-foreground">
                <Link to="/auth">{t("hero.cta.ngo")}</Link>
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
            {[
              { v: "128k", k: "stats.meals" },
              { v: "2,400+", k: "stats.donors" },
              { v: "180", k: "stats.ngos" },
              { v: "42", k: "stats.cities" },
            ].map((s) => (
              <div key={s.k} className="bg-card p-6">
                <div className="font-serif text-4xl">{s.v}</div>
                <div className="mt-1 text-sm text-muted-foreground">{t(s.k)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-leaf">The flow</div>
              <h2 className="mt-2 font-serif text-4xl md:text-5xl">From plate to people in minutes.</h2>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { i: Heart, t: "Donors post", d: "Restaurants, halls, supermarkets and households share surplus food with a photo, quantity and pickup window." },
              { i: Bell, t: "NGOs are alerted", d: "Verified NGOs nearby get a live notification and can accept with one tap. Emergency hunger alerts go out instantly." },
              { i: MapPin, t: "Volunteers deliver", d: "Volunteers navigate via Google Maps, confirm pickup, deliver, and upload proof of delivery." },
            ].map((step, i) => (
              <motion.div
                key={step.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border bg-card p-6 shadow-soft"
              >
                <step.i className="h-6 w-6 text-leaf" />
                <h3 className="mt-4 font-serif text-2xl">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-leaf to-leaf/80 p-10 text-paper md:p-16">
          <div className="absolute inset-0 grain opacity-20" />
          <div className="relative max-w-2xl">
            <Users className="h-8 w-8" />
            <h2 className="mt-4 font-serif text-4xl md:text-5xl">Join the rescue network.</h2>
            <p className="mt-4 text-paper/80">No food should go to waste while neighbors go hungry. Sign up in 30 seconds.</p>
            <Button asChild size="lg" variant="secondary" className="mt-8 h-12 px-6">
              <Link to="/auth">Get started — it's free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FoodLink — {t("tagline")}
      </footer>
    </div>
  );
}
