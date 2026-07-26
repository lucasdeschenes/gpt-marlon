// German -> English strings for the ported Framer homepage.
//
// The Framer markup carries no data-en attributes, so build-home.mjs injects
// them from this table. Keys are the German text with whitespace collapsed;
// anything not listed here is left alone (brand names, tool names, dates, and
// the guide cards, whose German titles come from guides/data/*.json).
//
// To add a string: run `node tools/build-home.mjs` — it prints every text block
// it could not match, so untranslated copy shows up rather than failing quietly.

export const T = {
  "KI-TOOLS TRAINING": "AI TOOLS TRAINING",

  "Lerne mit mir, KI effektiv zu nutzen.":
    "Learn to use AI effectively, with me.",

  "Ich bin kein Entwickler und kein Ki researcher. Ich habe mir meine gesamte Kenntnis selbst beigebracht und teile hier mein gesamtes Wissen, meine Erfahrungen und die Strategien, die ich täglich nutze.":
    "I'm not a developer and I'm not an AI researcher. I taught myself everything I know, and I share all of it here: the knowledge, the experience and the strategies I use every day.",

  // The hero packs a bold headline and the bio into one <p>, separated by a
  // <br>. Give the two parts separately so the English keeps the same shape —
  // a flat string would lose both the bold and the line break.
  "Lerne mit mir, KI effektiv zu nutzen.Ich bin kein Entwickler und kein Ki researcher. Ich habe mir meine gesamte Kenntnis selbst beigebracht und teile hier mein gesamtes Wissen, meine Erfahrungen und die Strategien, die ich selbst täglich nutze.": {
    bold: "Learn to use AI effectively, with me.",
    rest: "I'm not a developer and I'm not an AI researcher. I taught myself everything I know, and I share all of it here: the knowledge, the experience and the strategies I use every day.",
  },

  "Lerne mit mir, KI effektiv zu nutzen.Ich bin kein Entwickler und kein Ki researcher. Ich habe mir meine gesamte Kenntnis selbst beigebracht und teile hier mein gesamtes Wissen, meine Erfahrungen und die Strategien, die ich täglich nutze.": {
    bold: "Learn to use AI effectively, with me.",
    rest: "I'm not a developer and I'm not an AI researcher. I taught myself everything I know, and I share all of it here: the knowledge, the experience and the strategies I use every day.",
  },

  "Community beitreten": "Join the community",
  "Tägliche KI-Tipps und Learnings.": "Daily AI tips and learnings.",
  "AI CREATOR": "AI CREATOR",

  "Hey — ich bin Marlon.": "Hey — I'm Marlon.",

  "Mehrere Jahre war ich im Venture Capital und habe in KI-Startups investiert. Alles, was ich über KI weiß, habe ich mir selbst beigebracht.":
    "I spent several years in venture capital investing in AI startups. Everything I know about AI, I taught myself.",

  "Heute läuft mein eigenes Business zu 90 % über KI-Agenten, die ich selbst gebaut habe. Genau das gibt mir den Kopf frei für GPTMarlon: Ich teile hier alles, was ich weiß, damit du es auch schaffst.":
    "Today my own business runs 90% on AI agents I built myself. That's exactly what frees up my head for GPTMarlon: I share everything I know here, so you can do it too.",

  "Der beste Zeitpunkt, um mit KI anzufangen, ist jetzt!":
    "The best time to start with AI is now!",

  "Tägliche KI-Tipps auf Instagram": "Daily AI tips on Instagram",

  "Kurze, praktische Reels, die zeigen, wie man KI-Tools wirklich nutzt – jeden Tag auf Instagram.":
    "Short, practical reels showing how to really use AI tools – every day on Instagram.",

  "Meine neuesten Guides": "My newest guides",

  "Lerne Schritt für Schritt, wie du KI effektiv im Alltag und Beruf einsetzt – von den Grundlagen bis zu fortgeschrittenen Workflows.":
    "Learn step by step how to use AI effectively in daily life and at work – from the basics to advanced workflows.",

  "Alle Guides": "All guides",

  "Fragen stellen": "Ask a question",

  "Hast du Fragen zu KI? Stell sie mir hier.":
    "Got a question about AI? Ask me here.",

  "Schreib mir, wobei du Unterstützung brauchst – ob Tool-Auswahl, Prompts, Workflows oder konkrete KI-Anwendungen. Ich melde mich so schnell wie möglich zurück.":
    "Tell me what you need a hand with – choosing tools, prompts, workflows or specific AI use cases. I'll get back to you as soon as I can.",

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
  "ElevenLabs", "Cursor AI", "Runway", "ChatGPT", "Content", "Claude Basics",
  "Email", "© 2026 GPTMarlon", "Book me", "Alltag", "Karriere",
]);
