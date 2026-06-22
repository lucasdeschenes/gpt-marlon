import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, BottomNav, Footer } from "@/components/Chrome";
import { ResourceCard } from "@/components/ResourceCard";
import { useResources } from "@/lib/useResources";

export const Route = createFileRoute("/ressourcen/$slug")({
  component: GuidePage,
  notFoundComponent: () => (
    <div className="bg-app min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-24 text-center">
        <h1 className="text-3xl font-black">Guide nicht gefunden</h1>
        <p className="mt-3 text-muted-foreground">Diesen Guide gibt es leider nicht (mehr).</p>
        <Link to="/ressourcen" className="btn-primary inline-flex mt-6 px-5 py-3 rounded-full font-semibold">
          ← Zurück zu Ressourcen
        </Link>
      </div>
      <BottomNav />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="bg-app min-h-screen p-10 text-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
});

function GuidePage() {
  const { slug } = Route.useParams();
  const { resources } = useResources();
  const resource = resources.find((r) => r.slug === slug);

  if (!resource) throw notFound();

  const related = resources.filter((r) => r.slug !== slug).slice(0, 3);

  return (
    <div className="bg-app min-h-screen">
      <Navbar />

      <article className="mx-auto max-w-3xl px-5 pt-10 pb-16">
        <Link to="/ressourcen" className="text-sm text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1">
          ← Zurück zu Ressourcen
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="label-accent">{resource.type}</span>
          <span className="text-muted-foreground">· {resource.lesezeit}</span>
          <span className="text-muted-foreground">· {resource.veroeffentlicht}</span>
        </div>

        <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
          {resource.title}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">{resource.description}</p>

        {/* Download Box */}
        <div className="mt-8 rounded-2xl p-5 md:p-6 bg-card-glass flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="w-12 h-12 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 3v12m0 0l-5-5m5 5l5-5M5 21h14"/></svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base md:text-lg">Hol dir den vollständigen Guide als PDF</h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "var(--gradient-primary)", color: "white" }}>
                KOSTENLOS
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Speichern, ausdrucken, offline lesen. Gehört dir.</p>
          </div>
          <a
            href={resource.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary px-5 py-3 rounded-full font-semibold text-center whitespace-nowrap"
          >
            Herunterladen ↓
          </a>
        </div>

        {/* Body */}
        <div className="mt-12 prose-content">
          <MarkdownContent text={resource.inhalt} />
        </div>

        {/* Prompt Code */}
        {resource.promptCode && (
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-black mb-4">Der vollständige Prompt</h2>
            <CodeBox code={resource.promptCode} />
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="text-2xl md:text-3xl font-black mb-6">Weitere Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((r) => (
              <ResourceCard key={r.slug} resource={r} />
            ))}
          </div>
        </section>
      )}

      <Footer />
      <BottomNav />
    </div>
  );
}

function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-2xl bg-card-glass overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="label-accent">Prompt</span>
        <button onClick={copy} className="btn-ghost px-3 py-1.5 rounded-full text-xs font-semibold">
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap text-foreground/90 font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  // Minimal markdown: ## headings, ### subheadings, **bold**, lists, paragraphs
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-5 text-foreground/90 leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          return <h3 key={i} className="text-xl md:text-2xl font-bold mt-6">{block.slice(4)}</h3>;
        }
        if (block.startsWith("## ")) {
          return <h2 key={i} className="text-2xl md:text-3xl font-black mt-8">{block.slice(3)}</h2>;
        }
        if (/^[-*] /m.test(block)) {
          const items = block.split("\n").filter((l) => /^[-*] /.test(l)).map((l) => l.replace(/^[-*] /, ""));
          return (
            <ul key={i} className="list-disc list-inside space-y-2 text-muted-foreground">
              {items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />)}
            </ul>
          );
        }
        return <p key={i} className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderInline(block) }} />;
      })}
    </div>
  );
}

function renderInline(s: string) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-foreground text-sm">$1</code>');
}
