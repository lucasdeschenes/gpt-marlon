import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Navbar, BottomNav } from "@/components/Chrome";
import { useResources } from "@/lib/useResources";
import type { Category, Resource, ResourceType } from "@/lib/resources";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

const PASSWORD = "gptmarlon2026";
const AUTH_KEY = "gptmarlon_admin_auth_v1";

const EMPTY: Resource = {
  slug: "",
  title: "",
  description: "",
  category: "Claude",
  type: "Guides",
  downloadUrl: "",
  lesezeit: "5 Min. Lesezeit",
  veroeffentlicht: new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" }),
  inhalt: "",
  promptCode: "",
  featured: false,
};

function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="bg-app min-h-screen">
        <Navbar />
        <div className="max-w-md mx-auto px-5 py-24">
          <h1 className="text-3xl font-black mb-6">Admin-Bereich</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pwd === PASSWORD) {
                sessionStorage.setItem(AUTH_KEY, "1");
                setAuthed(true);
              } else {
                alert("Falsches Passwort");
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Passwort"
              className="w-full rounded-xl bg-card-glass px-4 py-3 outline-none"
            />
            <button className="btn-primary w-full py-3 rounded-xl font-semibold">Anmelden</button>
          </form>
        </div>
        <BottomNav />
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const { resources, update } = useResources();
  const [editing, setEditing] = useState<Resource | null>(null);
  const [isNew, setIsNew] = useState(false);

  const startNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
  };

  const startEdit = (r: Resource) => {
    setEditing({ ...r });
    setIsNew(false);
  };

  const remove = (slug: string) => {
    if (!confirm("Diesen Guide wirklich löschen?")) return;
    update(resources.filter((r) => r.slug !== slug));
  };

  const save = () => {
    if (!editing) return;
    if (!editing.slug.trim() || !editing.title.trim()) {
      alert("Slug und Titel sind Pflicht.");
      return;
    }
    if (isNew && resources.some((r) => r.slug === editing.slug)) {
      alert("Slug existiert bereits.");
      return;
    }
    const next = isNew
      ? [editing, ...resources]
      : resources.map((r) => (r.slug === editing.slug ? editing : r));
    update(next);
    setEditing(null);
  };

  return (
    <div className="bg-app min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">Admin – Guides</h1>
          <div className="flex gap-2">
            <button onClick={startNew} className="btn-primary px-4 py-2 rounded-full text-sm font-semibold">+ Neuer Guide</button>
            <button
              onClick={() => { sessionStorage.removeItem(AUTH_KEY); location.reload(); }}
              className="btn-ghost px-4 py-2 rounded-full text-sm font-semibold"
            >
              Abmelden
            </button>
          </div>
        </div>

        {editing && (
          <EditForm
            value={editing}
            onChange={setEditing}
            onSave={save}
            onCancel={() => setEditing(null)}
            isNew={isNew}
          />
        )}

        <div className="mt-8 space-y-2">
          {resources.map((r) => (
            <div key={r.slug} className="rounded-xl bg-card-glass p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{r.category} · {r.type} · {r.slug}</div>
                <div className="font-semibold truncate">{r.title}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(r)} className="btn-ghost px-3 py-1.5 rounded-full text-xs">Bearbeiten</button>
                <button onClick={() => remove(r.slug)} className="btn-ghost px-3 py-1.5 rounded-full text-xs text-destructive">Löschen</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function EditForm({
  value, onChange, onSave, onCancel, isNew,
}: {
  value: Resource;
  onChange: (r: Resource) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const set = <K extends keyof Resource>(k: K, v: Resource[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="rounded-2xl bg-card-glass p-5 space-y-3">
      <h2 className="text-xl font-bold">{isNew ? "Neuen Guide erstellen" : "Guide bearbeiten"}</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Slug (URL)"><input className="inp" value={value.slug} disabled={!isNew} onChange={(e) => set("slug", e.target.value)} /></Field>
        <Field label="Titel"><input className="inp" value={value.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Kategorie">
          <select className="inp" value={value.category} onChange={(e) => set("category", e.target.value as Category)}>
            <option>Claude</option><option>ChatGPT</option><option>Multi-Tool</option>
          </select>
        </Field>
        <Field label="Typ">
          <select className="inp" value={value.type} onChange={(e) => set("type", e.target.value as ResourceType)}>
            <option>Prompts</option><option>Guides</option><option>Workflows</option><option>Tools</option>
          </select>
        </Field>
        <Field label="Lesezeit"><input className="inp" value={value.lesezeit} onChange={(e) => set("lesezeit", e.target.value)} /></Field>
        <Field label="Veröffentlicht"><input className="inp" value={value.veroeffentlicht} onChange={(e) => set("veroeffentlicht", e.target.value)} /></Field>
        <Field label="Download-URL (PDF)"><input className="inp" value={value.downloadUrl} onChange={(e) => set("downloadUrl", e.target.value)} /></Field>
        <Field label="Featured">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.featured} onChange={(e) => set("featured", e.target.checked)} /> Auf Startseite</label>
        </Field>
      </div>
      <Field label="Kurzbeschreibung"><textarea className="inp min-h-[80px]" value={value.description} onChange={(e) => set("description", e.target.value)} /></Field>
      <Field label="Inhalt (Markdown: ##, ###, **bold**, - listen)"><textarea className="inp min-h-[220px] font-mono text-sm" value={value.inhalt} onChange={(e) => set("inhalt", e.target.value)} /></Field>
      <Field label="Prompt-Code (optional)"><textarea className="inp min-h-[160px] font-mono text-sm" value={value.promptCode ?? ""} onChange={(e) => set("promptCode", e.target.value)} /></Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onSave} className="btn-primary px-5 py-2.5 rounded-full font-semibold">Speichern</button>
        <button onClick={onCancel} className="btn-ghost px-5 py-2.5 rounded-full font-semibold">Abbrechen</button>
      </div>
      <style>{`.inp { width:100%; background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:.75rem; padding:.6rem .8rem; color:inherit; outline:none; } .inp:focus{border-color:oklch(0.62 0.24 295);}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
