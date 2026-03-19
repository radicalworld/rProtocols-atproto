// features/needs/lib/actions.ts
export function createNeed(payload) {
    return fetch("/api/needs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then((res) => {
        if (!res.ok) {
            return res.text().then((text) => {
                throw new Error(text || "Failed to create need");
            });
        }
        return res.json();
    });
}
