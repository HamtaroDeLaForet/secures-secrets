"use client";

import { useEffect, useState } from "react";
import "./active-secrets-counter.css";

export default function ActiveSecretsCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

    const fetchStats = async () => {
      try {
        const r = await fetch(`${baseUrl}/stats`, { cache: "no-store" });
        if (!r.ok) return;

        const j = await r.json();
        setCount(j.active_secrets);
      } catch (e) {
        console.error("Stats error:", e);
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="active-secrets-counter" aria-label="Secrets actifs">
      <span className="active-secrets-counter__label">Secrets actifs</span>
      <span className="active-secrets-counter__value">{count ?? "..."}</span>
    </div>
  );
}
