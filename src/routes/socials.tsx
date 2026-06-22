import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar, BottomNav, Footer } from "@/components/Chrome";

export const Route = createFileRoute("/socials")({
  head: () => ({
    meta: [
      { title: "Socials – GPTMarlon" },
      { name: "description", content: "Folge GPTMarlon auf Instagram und bald auf YouTube." },
      { property: "og:title", content: "Socials – GPTMarlon" },
      { property: "og:description", content: "Folge GPTMarlon auf Instagram und bald auf YouTube." },
    ],
  }),
  component: Socials,
});

function Socials() {
  return (
    <div className="bg-app min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="hero-beam" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 md:pt-28 text-center">
          <span className="label-accent">Community</span>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Folge GPTMarlon
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-base md:text-lg text-muted-foreground">
            Hier findest du alle Kanäle – Instagram jetzt, YouTube bald.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Instagram */}
          <a
            href="https://instagram.com/GPTMarlon"
            target="_blank"
            rel="noreferrer"
            className="bg-card-glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center gap-4 transition hover:-translate-y-1"
          >
            <div
              className="w-14 h-14 rounded-2xl grid place-items-center"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>
            </div>
            <h2 className="text-xl font-bold">Instagram</h2>
            <p className="text-sm text-muted-foreground">Tägliche KI-Tipps, Reels und Updates.</p>
            <span className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold mt-2">
              @GPTMarlon besuchen →
            </span>
          </a>

          {/* YouTube – Coming Soon */}
          <div className="bg-card-glass rounded-2xl p-6 md:p-8 flex flex-col items-center text-center gap-4 opacity-60">
            <div className="w-14 h-14 rounded-2xl grid place-items-center bg-white/10">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20.46 12 20.46 12 20.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.5 16.5 12 9.75 8.5"/></svg>
            </div>
            <h2 className="text-xl font-bold">YouTube</h2>
            <p className="text-sm text-muted-foreground">In-depth Tutorials und KI-Deep-Dives – bald verfügbar.</p>
            <span className="px-5 py-2.5 rounded-full text-sm font-semibold mt-2 border border-white/10 text-muted-foreground">
              Coming Soon
            </span>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/ressourcen" className="btn-ghost inline-flex px-6 py-3 rounded-full font-semibold">
            ← Zu den Guides
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
