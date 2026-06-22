import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-app/80 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-full grid place-items-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}>
            <span className="text-white text-sm font-black">G</span>
          </span>
          <span>GPTMarlon</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "px-4 py-2 rounded-full text-sm text-foreground" }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/ressourcen" className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "px-4 py-2 rounded-full text-sm text-foreground" }}>
            Ressourcen
          </Link>
          <Link to="/socials" className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "px-4 py-2 rounded-full text-sm text-foreground" }}>
            Socials
          </Link>
        </nav>
        <Link to="/socials" className="hidden md:inline-flex btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">
          Socials
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-app/90 backdrop-blur-md border-t border-white/10">
      <div className="grid grid-cols-3 h-16">
        <Link to="/" className="flex flex-col items-center justify-center gap-1 text-muted-foreground" activeProps={{ className: "flex flex-col items-center justify-center gap-1 text-foreground" }} activeOptions={{ exact: true }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2V11z"/></svg>
          <span className="text-[10px]">Home</span>
        </Link>
        <Link to="/ressourcen" className="flex flex-col items-center justify-center gap-1 text-muted-foreground" activeProps={{ className: "flex flex-col items-center justify-center gap-1 text-foreground" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
          <span className="text-[10px]">Ressourcen</span>
        </Link>
        <Link to="/socials" className="flex flex-col items-center justify-center gap-1 text-muted-foreground" activeProps={{ className: "flex flex-col items-center justify-center gap-1 text-foreground" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="current gradientUnits"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span className="text-[10px]">Socials</span>
        </Link>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24 pb-24 md:pb-10">
      <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} GPTMarlon. Alle Rechte vorbehalten.</div>
        <Link to="/socials" className="hover:text-foreground transition">
          Socials ↗
        </Link>
      </div>
    </footer>
  );
}
