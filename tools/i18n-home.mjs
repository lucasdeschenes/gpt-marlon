// German -> English strings for the ported Framer homepage, plus the German
// copy fixes applied before translation.
//
// The Framer markup carries no data-en attributes, so build-home.mjs injects
// them from this table. Keys are the German text with whitespace collapsed;
// anything not listed here is left alone (brand names, tool names, dates, and
// the guide cards, whose German titles come from guides/data/*.json).
//
// To add a string: run `node tools/build-home.mjs` — it prints every text block
// it could not match, so untranslated copy shows up rather than failing quietly.

// ── German copy fixes ─────────────────────────────────────────────────────────
// The site is German-first, so house style is enforced on the German source and
// the English follows. No em/en dashes (period, comma or colon instead) and no
// emojis. Applied by build-home.mjs before the translation pass, so the keys in
// T below are the FIXED German, not what Framer shipped.
export const DE = {
  "Kurze, praktische Reels, die zeigen, wie man KI-Tools wirklich nutzt – jeden Tag auf Instagram.":
    "Kurze, praktische Reels, die zeigen, wie man KI-Tools wirklich nutzt. Jeden Tag auf Instagram.",

  "Lerne Schritt für Schritt, wie du KI effektiv im Alltag und Beruf einsetzt – von den Grundlagen bis zu fortgeschrittenen Workflows.":
    "Lerne Schritt für Schritt, wie du KI effektiv im Alltag und Beruf einsetzt: von den Grundlagen bis zu fortgeschrittenen Workflows.",

  "Schreib mir, wobei du Unterstützung brauchst – ob Tool-Auswahl, Prompts, Workflows oder konkrete KI-Anwendungen. Ich melde mich so schnell wie möglich zurück.":
    "Schreib mir, wobei du Unterstützung brauchst: ob Tool-Auswahl, Prompts, Workflows oder konkrete KI-Anwendungen. Ich melde mich so schnell wie möglich zurück.",
};

export const T = {
  // ── hero ──
  // The hero packs the title and the body into one <p> separated by a <br>.
  // Give the two parts separately so the English keeps the same shape — a flat
  // string would lose both the bold and the line break.
  "Hey, ich bin Marlon.Ich mache KI so einfach, dass sie jeder nutzen kann. Egal ob du ein Business aufbaust, Content machst oder einfach nicht den Anschluss verlieren willst: Alles, was ich weiß, findest du hier. Kostenlos. Ich habe mir das komplett selbst beigebracht. Also schaffst du das auch.": {
    bold: "Hey, I'm Marlon.",
    rest: "I make AI simple enough that anyone can use it. Whether you're building a business, making content or just don't want to fall behind: everything I know is here. Free. I taught myself all of it. So you can do it too.",
  },

  "Meine Story": "My story",
  "Community beitreten": "Join the community",
  "Tägliche KI-Tipps und Learnings.": "Daily AI tips and learnings.",

  // ── story ──
  "Mehrere Jahre war ich im Venture Capital und habe von außen zugeschaut, wie KI alles verändert. Irgendwann wollte ich nicht mehr nur zuschauen. Ich habe mir alles selbst beigebracht, ohne Studium in dem Bereich und ohne teure Kurse. Einfach durchs Machen.":
    "I spent several years in venture capital, watching from the outside while AI changed everything. At some point I didn't want to just watch anymore. I taught myself all of it, with no degree in the field and no expensive courses. Just by doing.",

  "Heute läuft mein Business zu 90 Prozent über KI-Agenten. Und genau das, was ich dabei lerne, teile ich jeden Tag auf Instagram und hier auf der Seite.":
    "Today my business runs 90 percent on AI agents. And what I learn doing it, I share every day on Instagram and here on the site.",

  "Erster Post": "First post",
  "27. Mai 2026": "May 27, 2026",
  "Views · letzte 30 Tage": "Views · last 30 days",

  // ── reels ──
  "Tägliche KI-Tipps auf Instagram": "Daily AI tips on Instagram",

  "Kurze, praktische Reels, die zeigen, wie man KI-Tools wirklich nutzt. Jeden Tag auf Instagram.":
    "Short, practical reels showing how to really use AI tools. Every day on Instagram.",

  // ── guides ──
  "Meine neuesten Guides": "My newest guides",

  "Lerne Schritt für Schritt, wie du KI effektiv im Alltag und Beruf einsetzt: von den Grundlagen bis zu fortgeschrittenen Workflows.":
    "Learn step by step how to use AI effectively in daily life and at work: from the basics to advanced workflows.",

  "Alle Guides": "All guides",

  // ── contact ──
  "Fragen stellen": "Ask a question",

  "Hast du Fragen zu KI? Stell sie mir hier.":
    "Got a question about AI? Ask me here.",

  "Schreib mir, wobei du Unterstützung brauchst: ob Tool-Auswahl, Prompts, Workflows oder konkrete KI-Anwendungen. Ich melde mich so schnell wie möglich zurück.":
    "Tell me what you need a hand with: choosing tools, prompts, workflows or specific AI use cases. I'll get back to you as soon as I can.",

  "Dein Name": "Your name",
  "Betreff": "Subject",
  "Frage": "Question",
  "Submit": "Send",
};

// input placeholders (data-en-ph)
export const PH = {
  "Marlon": "Marlon",
  "jane@framer.com": "you@email.com",
  "Betreff": "Subject",
  "Frage": "Your question",
};

// Strings that are intentionally identical in both languages, so the build
// doesn't report them as missing.
export const SAME = new Set([
  "GPT★Marlon", "Home", "Ressourcen", "OpenAI", "P", "Perplexity", "Claude",
  "ElevenLabs", "Cursor AI", "Higgsfield", "ChatGPT", "Content", "Claude Basics",
  "Email", "© 2026 GPTMarlon", "Book me", "Alltag", "Karriere",
  "AI Creator & Educator",
]);
