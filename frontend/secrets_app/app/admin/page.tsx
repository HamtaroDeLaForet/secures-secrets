"use client";

import { useEffect, useState } from "react";

type AdminSecretRow = {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  remainingReads: number | null;
  readCount: number;
  status: "active" | "expired";
};

function truncateId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-6)}`;
}

function buildSecretLink(origin: string, id: string) {
  return `${origin}/s/${id}`;
}

export default function AdminPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

  const [data, setData] = useState<AdminSecretRow[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "forbidden" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg("");

      try {
        const res = await fetch(`${API_BASE}/api/admin/secrets`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {}),
          },
        });

        if (!res.ok) {
          if (res.status === 403) {
            if (!cancelled) {
              setStatus("forbidden");
              setData([]);
            }
            return;
          }

          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        }

        const json = (await res.json()) as AdminSecretRow[];
        if (!cancelled) {
          setData(Array.isArray(json) ? json : []);
          setStatus("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
          setData([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, ADMIN_TOKEN]);

  async function copyLink(id: string) {
    const link = buildSecretLink(window.location.origin, id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {
      window.prompt("Copiez ce lien :", link);
    }
  }

  const secrets = data ?? [];
  const total = data ? secrets.length : 0;

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <h1>Administration</h1>
          <p>Liste des secrets créés. Le contenu n’est jamais affiché ici.</p>
        </header>

        <fieldset className="fieldset">
          <legend>Secrets ({total})</legend>

          {status === "loading" && (
            <div className="result">
              <strong>Chargement…</strong>
              <div className="hint">Récupération de la liste depuis le backend.</div>
            </div>
          )}

          {status === "forbidden" && (
            <div className="alert alert-error">
              <strong>Accès refusé (403)</strong>
              <div className="hint">
                Vérifie l’auth admin côté Django ou le token côté front.
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="alert alert-error">
              <strong>Erreur</strong>
              <div className="hint">{errorMsg || "Le backend est peut-être éteint."}</div>
            </div>
          )}

          {status !== "loading" && data && secrets.length === 0 && status !== "forbidden" && (
            <div className="result">
              <strong>Aucun secret</strong>
              <div className="hint">
                La liste est vide, ou aucun secret n’a encore été créé.
              </div>
            </div>
          )}

          {status !== "loading" && data && secrets.length > 0 && (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Secret</th>
                    <th>Créé</th>
                    <th>Expire</th>
                    <th>Lectures</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {secrets.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="mono" title={s.id}>
                          {truncateId(s.id)}
                        </div>
                        <div className="hint">/s/{s.id}</div>
                      </td>

                      <td className="mono">{s.createdAt}</td>
                      <td className="mono">{s.expiresAt ?? "—"}</td>

                      <td className="mono">
                        {s.readCount}
                        {s.remainingReads !== null ? ` (reste ${s.remainingReads})` : ""}
                      </td>

                      <td>
                        <span
                          className={[
                            "badge",
                            s.status === "active" ? "badge-ok" : "badge-ko",
                          ].join(" ")}
                        >
                          {s.status === "active" ? "Actif" : "Expiré"}
                        </span>
                      </td>

                      <td>
                        <div className="actions">
                          <button type="button" className="btnSmall" onClick={() => copyLink(s.id)}>
                            {copiedId === s.id ? "Copié ✓" : "Copier le lien"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="hint">
            Endpoint attendu : <span className="mono">{API_BASE}/api/admin/secrets</span>
          </div>
        </fieldset>
      </div>
    </main>
  );
}
