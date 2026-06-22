import { useEffect, useState } from "react";
import { loadResources, saveResources, type Resource } from "./resources";

export function useResources() {
  const [resources, setResources] = useState<Resource[]>(() => loadResources());

  useEffect(() => {
    setResources(loadResources());
  }, []);

  const update = (next: Resource[]) => {
    setResources(next);
    saveResources(next);
  };

  return { resources, update };
}
