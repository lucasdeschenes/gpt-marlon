export type Category = "Claude" | "ChatGPT" | "Multi-Tool";
export type ResourceType = "Prompts" | "Guides" | "Workflows" | "Tools";

export interface Resource {
  slug: string;
  title: string;
  description: string;
  category: Category;
  type: ResourceType;
  downloadUrl: string;
  lesezeit: string;
  veroeffentlicht: string;
  inhalt: string;
  promptCode?: string;
  featured: boolean;
}

export const SEED_RESOURCES: Resource[] = [
  {
    slug: "claude-fitness-coach-2026",
    title: "Verwandle Claude in deinen persönlichen Fitness-Coach",
    description:
      "Verbinde Claude mit Apple Health und Google Kalender, damit personalisierte Workouts auf Basis deines Schlafs und deiner Erholung entstehen. Inkl. komplettem Prompt.",
    category: "Claude",
    type: "Workflows",
    downloadUrl: "https://example.com/guides/claude-fitness-coach.pdf",
    lesezeit: "9 Min. Lesezeit",
    veroeffentlicht: "7. Mai 2026",
    featured: true,
    promptCode: `# Du verbindest dich mit den Gesundheitsdaten des Nutzers (Apple Health oder Health Connect) und Google Kalender.
# Du rätst nie. Du verwendest nie generische Vorlagen. Du schaust dir an, was tatsächlich
# gestern passiert ist, und planst entsprechend. Jedes Workout ist für DIESE Person an
# DIESEM Tag basierend auf IHREN Daten gebaut.

--- SCHRITT 1: LERNE DEN NUTZER KENNEN ---
1. Was ist dein primäres Fitness-Ziel?
2. Hast du ein sekundäres Ziel?
3. Welches Equipment steht dir zur Verfügung?
4. An wie vielen Tagen pro Woche kannst du realistisch trainieren?`,
    inhalt: `## Was du bekommst

Ein vollständiger Projekt-Prompt, der Claude in einen persönlichen Trainer verwandelt – er liest deine echten Gesundheitsdaten, baut Workouts rund um deinen Schlaf und deine Erholung und legt sie direkt in deinen Kalender.

## So richtest du es ein

Das dauert etwa 5 Minuten. Danach hast du einen Coach, der wirklich deine Daten kennt.

### Schritt 1: Erstelle ein Projekt in Claude

Gehe zu claude.ai und klicke links auf "Projekte", dann "Projekt erstellen". Nenne es "Fitness Coach".

### Schritt 2: Verbinde Apple Health (oder Health Connect)

Öffne die Claude-App auf deinem iPhone. Gehe zu Einstellungen → Berechtigungen. Aktiviere Gesundheit und gib alle Kategorien frei: Schritte, Schlaf, Herzfrequenz, Workouts.

### Schritt 3: Verbinde Google Kalender

Gehe zu claude.ai und öffne die Einstellungen (unten links). Klicke auf Connectors, finde Google Kalender und verbinde ihn.`,
  },
  {
    slug: "chatgpt-secret-codes-100",
    title: "Marlons ChatGPT Secret Codes: 100 Prompt-Shortcuts",
    description:
      "100 Slash-Befehle und Shortcut-Codes nach Kategorien sortiert – Schreiben, Lernen, Brainstorming und mehr.",
    category: "ChatGPT",
    type: "Prompts",
    downloadUrl: "https://example.com/guides/chatgpt-secret-codes.pdf",
    lesezeit: "6 Min. Lesezeit",
    veroeffentlicht: "12. April 2026",
    featured: true,
    promptCode: `/zusammenfassen [Text] – Erstellt eine prägnante Zusammenfassung
/erklaere [Thema] wie 5 – Einfache Erklärung für Anfänger
/widerlege [Argument] – Findet Gegenargumente und Schwachstellen
/verbessere [Text] – Schreibt eleganter und präziser um`,
    inhalt: `## Die schnellste Art, ChatGPT zu bedienen

Hör auf, jedes Mal lange Prompts zu schreiben. Mit diesen 100 Shortcut-Codes bekommst du in Sekunden bessere Ergebnisse.

## So funktioniert es

Speichere die Codes in deinen ChatGPT-Einstellungen unter "Benutzerdefinierte Anweisungen". Danach reicht ein "/befehl" und ChatGPT versteht sofort, was du willst.

## Beispiel-Kategorien

- **Schreiben** – /verbessere, /kuerzen, /umschreiben
- **Lernen** – /erklaere, /quiz, /beispiel
- **Brainstorming** – /ideen, /pro-contra, /perspektiven`,
  },
  {
    slug: "claude-bewerbung-job-finden",
    title: "So nutzt du Claude für deine nächste Bewerbung",
    description:
      "Lebenslauf-Audit, ATS-Optimierung, automatisches Bewerben, Anschreiben, Interview-Vorbereitung und Gehaltsverhandlung.",
    category: "Claude",
    type: "Guides",
    downloadUrl: "https://example.com/guides/claude-bewerbung.pdf",
    lesezeit: "11 Min. Lesezeit",
    veroeffentlicht: "28. März 2026",
    featured: true,
    inhalt: `## Dein KI-Karriere-Stack

Claude kann den kompletten Bewerbungsprozess für dich übernehmen – vom ersten Lebenslauf-Check bis zur Gehaltsverhandlung.

## Was dieser Guide abdeckt

1. **Lebenslauf-Audit** – Lass Claude deinen CV gegen die Job-Beschreibung prüfen
2. **ATS-Optimierung** – Schreibe so, dass Bewerbungssysteme dich nicht aussortieren
3. **Anschreiben in 30 Sekunden** – Personalisierte Anschreiben für jede Stelle
4. **Interview-Vorbereitung** – Übe typische Fragen mit Claude als Recruiter
5. **Gehaltsverhandlung** – Datenbasierte Argumente und Skripte für das Gespräch`,
  },
];

const STORAGE_KEY = "gptmarlon_resources_v1";

export function loadResources(): Resource[] {
  if (typeof window === "undefined") return SEED_RESOURCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_RESOURCES;
    const parsed = JSON.parse(raw) as Resource[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_RESOURCES;
    return parsed;
  } catch {
    return SEED_RESOURCES;
  }
}

export function saveResources(resources: Resource[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
}
