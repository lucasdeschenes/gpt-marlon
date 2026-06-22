import { Link } from "@tanstack/react-router";
import type { Resource } from "@/lib/resources";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      to="/ressourcen/$slug"
      params={{ slug: resource.slug }}
      className="group block rounded-2xl p-6 bg-card-glass transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="label-accent">{resource.type}</span>
        <span className="text-xs text-muted-foreground">· {resource.category}</span>
      </div>
      <h3 className="text-xl font-bold leading-tight mb-2 group-hover:accent-text transition-colors">
        {resource.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
      <div className="mt-4 text-sm font-medium text-foreground/80 group-hover:text-foreground transition flex items-center gap-1">
        Ansehen <span aria-hidden>→</span>
      </div>
    </Link>
  );
}

export function ResourceRow({ resource }: { resource: Resource }) {
  return (
    <Link
      to="/ressourcen/$slug"
      params={{ slug: resource.slug }}
      className="group block py-6 border-b border-white/5 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="label-accent">{resource.type}</span>
            <span className="text-xs text-muted-foreground">· {resource.category}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold leading-tight mb-1 group-hover:accent-text">
            {resource.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition mt-1">→</div>
      </div>
    </Link>
  );
}
