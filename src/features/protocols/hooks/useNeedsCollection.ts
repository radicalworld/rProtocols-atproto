// src/hooks/useNeedsCollection.ts
import { useEffect, useState } from "react";
import { fetchNeed } from "@/api/needs";

export function useNeedsCollection(rootIds: string[]) {
  const [needs, setNeeds] = useState<any[]>([]);

  useEffect(() => {
    Promise.all(rootIds.map(id => fetchNeed(id))).then(setNeeds);
  }, [rootIds]);

  return needs;
}