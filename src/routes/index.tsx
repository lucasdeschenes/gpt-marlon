import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar, BottomNav, Footer } from "@/components/Chrome";
import { ResourceCard } from "@/components/ResourceCard";
import { useResources } from "@/lib/useResources";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GPTMarlon – KI, die dein Leben verändert." },
      { name: "description", content: "Kostenlose KI-Guides, Prompts und Workflows. Von @GPTMarlon." },
      { property: "og:title", content: "GPTMarlon – KI, die dein Leben verändert." },
      { property: "og:description", content: "Kostenlose KI-Guides, Prompts und Workflows." },
    ],
  }),
  component: Home,
});

function Home() {
  const { resources } = useResources();
  const featured = resources.slice(0, 6);

  return (
    <div className="bg-app min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-beam" />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-20 md:pt-28 md:pb-32 text-center">
          <span className="label-accent">KI Creator</span>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
            KI, die dein Leben verändert.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            KI einfach erklärt. Kostenlos. Alle meine Prompts, Guides und Workflows an einem Ort.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/ressourcen" className="btn-primary px-6 py-3.5 rounded-full font-semibold w-full sm:w-auto">
              Alle Guides ansehen →
            </Link>
            <Link to="/socials" className="btn-ghost px-6 py-3.5 rounded-full font-semibold w-full sm:w-auto">
              Socials →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="label-accent">Free Guides</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-black leading-tight">Meine Free Guides</h2>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Tausende Stunden KI-Tests – destilliert in Prompts, Guides und Workflows, die du heute nutzen kannst.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((r) => (
            <ResourceCard key={r.slug} resource={r} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link to="/ressourcen" className="btn-ghost inline-flex px-6 py-3 rounded-full font-semibold">
            Alle ansehen →
          </Link>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
