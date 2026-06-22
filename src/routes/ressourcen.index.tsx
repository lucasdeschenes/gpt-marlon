import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navbar, BottomNav, Footer } from "@/components/Chrome";
import { ResourceRow } from "@/components/ResourceCard";
import { useResources } from "@/lib/useResources";
import type { Category, ResourceType } from "@/lib/resources";

export const Route = createFileRoute("/ressourcen/")({
  head: () => ({
    meta: [
      { title: "Alle KI-Guides – GPTMarlon" },
      { name: "description", content: "Alle KI-Guides, Prompts und Workflows. Kostenlos." },
      { property: "og:title", content: "Alle KI-Guides – GPTMarlon" },
      { property: "og:description", content: "Alle KI-Guides, Prompts und Workflows. Kostenlos." },
    ],
  }),
  component: Ressourcen,
});

const TOOLS: ("Alle" | Category)[] = ["Alle", "Claude", "ChatGPT", "Multi-Tool"];
const TYPES: ("Alle" | ResourceType)[] = ["Alle", "Prompts", "Guides", "Workflows", "Tools"];

function Ressourcen() {
  const { resources } = useResources();
  const [tool, setTool] = useState<(typeof TOOLS)[number]>("Alle");
  const [type, setType] = useState<(typeof TYPES)[number]>("Alle");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      if (tool !== "Alle" && r.category !== tool) return false;
      if (type !== "Alle" && r.type !== type) return false;
      if (q && !(`${r.title} ${r.description} ${r.category} ${r.type}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [resources, tool, type, search]);

  return (
    <div className="bg-app min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="hero-beam" />
        <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-10 md:pt-24 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Alle KI-Guides. <span className="accent-text text-glow">Kostenlos.</span>
          </h1>
          <p className="mt-5 text-muted-foreground">Finde in Sekunden, was du brauchst. Immer kostenlos.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        {/* Filters */}
        <div className="space-y-5">
          <div>
            <div className="label-accent mb-2">Nach Tool</div>
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-none">
              {TOOLS.map((t) => (
                <button key={t} onClick={() => setTool(t)} className={`chip ${tool === t ? "chip-active" : ""}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="label-accent mb-2">Nach Typ</div>
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-none">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)} className={`chip ${type === t ? "chip-active" : ""}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="label-accent mb-2">Suche</div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tool oder Stichwort suchen, z.B. Claude, Prompts..."
              className="w-full rounded-2xl bg-card-glass px-5 py-4 text-base outline-none focus:border-primary placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Zeige <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "Ressource" : "Ressourcen"}
          </div>
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Keine Ergebnisse. Versuche es mit einem anderen Filter.
            </div>
          ) : (
            filtered.map((r) => <ResourceRow key={r.slug} resource={r} />)
          )}
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
