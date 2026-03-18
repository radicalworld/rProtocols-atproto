// src/hooks/useNeedsCollection.ts
import { useEffect, useState } from "react";
import { fetchNeed } from "@/api/needs";
export function useNeedsCollection(rootIds) {
    const [needs, setNeeds] = useState([]);
    useEffect(() => {
        Promise.all(rootIds.map(id => fetchNeed(id))).then(setNeeds);
    }, [rootIds]);
    return needs;
}
