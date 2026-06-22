# GPTMarlon – Projektkontext für Claude Code

Persönliche Website von @GPTMarlon (deutschsprachiger KI-Creator). Hub für kostenlose
KI-Guides, Prompts und Workflows. Der Social-Funnel (Instagram → DM) leitet hierher;
die Seite ist die zentrale Ressourcen-Bibliothek.

**Sprache:** Alle UI-Texte und Inhalte sind auf **Deutsch**. Code/Kommentare auf Englisch ist ok.

---

## Stack

- **Framework:** TanStack Start (SSR) + TanStack Router (file-based routing)
- **UI:** React 19, shadcn/ui (Style "new-york"), Radix Primitives, lucide-react Icons
- **Styling:** Tailwind CSS v4 (`@theme inline` in `src/styles.css`, CSS-Variablen, OKLCH-Farben)
- **State/Data:** React Query installiert (aktuell ungenutzt), Zod, react-hook-form
- **Runtime/Deploy:** Bun, Nitro, Cloudflare (Wrangler)
- **Sprache:** TypeScript (strict)

## Befehle

```bash
bun install        # Abhängigkeiten
bun dev            # Lokaler Dev-Server (vite dev)
bun run build      # Production-Build
bun run lint       # ESLint
bun run format     # Prettier
```

## Struktur

```
src/
  routes/                 # file-based routes (TanStack Router)
    __root.tsx            # Root-Layout
    index.tsx             # Startseite (Hero + Featured Guides)
    ressourcen.index.tsx  # Ressourcen-Übersicht (Filter-Chips)
    ressourcen.$slug.tsx  # Guide-Detailseite (Download-Box, Prompt, Inhalt)
    socials.tsx           # Social-Links
    admin.tsx             # Admin (Ressourcen verwalten) — siehe Sicherheits-Warnung
  components/
    Chrome.tsx            # Navbar, BottomNav, Footer
    ResourceCard.tsx      # Karte für eine Ressource
    ui/                   # shadcn/ui-Komponenten (nicht per Hand umbauen)
  lib/
    resources.ts          # Resource-Typ + SEED_RESOURCES + localStorage-Logik
    useResources.ts       # Hook, lädt/speichert Ressourcen
    utils.ts              # cn() etc.
  styles.css              # Design-Tokens + Utility-Klassen
  router.tsx, server.ts, start.ts
```

**Pfad-Aliase:** `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`

## Datenmodell

`Resource` (siehe `src/lib/resources.ts`): `slug`, `title`, `description`, `category`,
`type` ("Prompts" | "Guides" | "Workflows" | "Tools"), `downloadUrl`, `lesezeit`,
`veroeffentlicht`, `inhalt` (Markdown-artiger String), `promptCode?`, `featured`.

## Design-System (in `src/styles.css`)

- **Nur Dark Mode.** Seiten-Hintergrund `#080810`.
- **Primärfarbe:** Violett `oklch(0.62 0.24 295)`, Verlauf via `--gradient-primary`.
- **Font:** Inter. **Radius:** `0.875rem`.
- **Utility-Klassen (1:1 verwenden):** `.bg-app`, `.bg-card-glass` (Glassmorphism-Karte),
  `.btn-primary`, `.btn-ghost`, `.accent-text` (Verlaufs-Text), `.text-glow`,
  `.label-accent` (Uppercase-Label), `.hero-beam` (Hintergrund-Glow), `.chip` / `.chip-active`.
- Neue Farben/Effekte **nicht erfinden** — bestehende Tokens und Klassen nutzen.

## Konventionen

- Prettier: `printWidth: 100`, `semi: true`, doppelte Anführungszeichen, `trailingComma: "all"`.
- shadcn/ui-Komponenten in `components/ui/` bleiben unangetastet; eigene Komponenten daneben.
- Nach Änderungen: `bun run lint` und `bun run build` müssen sauber durchlaufen.

## Bekannte Schwachstellen (Roadmap)

1. **Daten nur im `localStorage`** (`gptmarlon_resources_v1`). Admin-Änderungen sind nur
   im eigenen Browser sichtbar, nicht für Besucher. → echte Datenquelle nötig.
2. **`downloadUrl` = `example.com`-Platzhalter.** Downloads funktionieren nicht. → echtes
   PDF-Hosting + echte Links.
3. **Admin-Login unsicher:** Passwort steht im Klartext im Client-Code
   (`admin.tsx`), Auth über `sessionStorage`. → echte Auth.
4. Keine E-Mail-Erfassung, kein Analytics, `inhalt` wird nicht als echtes Markdown gerendert.

## Arbeitsweise

- Vor größeren Änderungen kurz den Plan nennen, dann umsetzen.
- Bestehende Muster/Komponenten wiederverwenden statt neue Patterns einzuführen.
- Änderungen klein halten und nach jedem Schritt build/lint prüfen.
