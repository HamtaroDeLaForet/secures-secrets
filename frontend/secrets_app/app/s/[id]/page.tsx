"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type RevealResponse = { secret: string };

export default function RevealPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const params = useParams();
  const id = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)?.id;
    return typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  }, [params]);

  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadName, setDownloadName] = useState<string>("");

  function extractFilename(contentDisposition: string | null): string {
    if (!contentDisposition) return "";
    // try: filename="xxx"
    const m = contentDisposition.match(/filename="([^"]+)"/i);
    return m?.[1] ?? "";
  }

  async function reveal() {
    setStatus("loading");
    setErrorMessage("");
    setSecret("");
    setDownloadName("");

    if (!apiBase) {
      setStatus("error");
      setErrorMessage("NEXT_PUBLIC_API_BASE manquant (.env.local)");
      return;
    }
    if (!id) {
      setStatus("error");
      setErrorMessage("Identifiant manquant dans l’URL.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/secrets/${id}/reveal/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 403) {
        setStatus("error");
        setErrorMessage("Mot de passe incorrect.");
        return;
      }

      if (res.status === 404) {
        setStatus("error");
        setErrorMessage("Secret introuvable, expiré ou déjà consommé.");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(`Erreur API (${res.status})`);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      const cd = res.headers.get("content-disposition");
      const filename = extractFilename(cd);

      // ✅ Cas texte (JSON)
      if (contentType.includes("application/json")) {
        const data = (await res.json()) as RevealResponse;
        setSecret(data.secret);
        setStatus("done");
        return;
      }

      // ✅ Cas fichier (download)
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "secret";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // cleanup
      setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setDownloadName(filename || "secret");
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <h1>Accéder au secret</h1>
          <p>
            Entrez le mot de passe pour afficher le contenu. Si le secret a expiré ou a été consommé,
            il ne sera plus disponible.
          </p>
        </header>

        <div className="form">
          <fieldset className="fieldset">
            <legend>Déchiffrement</legend>

            <div className="row">
              <label className="label">Identifiant :</label>
              <div style={{ padding: "10px 0" }}>
                <code className="link">{id || "—"}</code>
              </div>
            </div>

            <div className="row">
              <label className="label">Mot de passe :</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Le mot de passe utilisé à la création"
              />
            </div>
          </fieldset>

          <button
            className="cta"
            type="button"
            onClick={reveal}
            disabled={status === "loading" || password.length === 0}
          >
            {status === "loading" ? "Vérification..." : "Afficher le secret"}
          </button>

          {status === "error" && <div className="alert alert-error">❌ {errorMessage}</div>}

          {status === "done" && secret && (
            <div className="result">
              <div className="resultLine">
                <span>✅ Secret :</span>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", margin: "10px 0 0" }}>{secret}</pre>
            </div>
          )}

          {status === "done" && !secret && downloadName && (
            <div className="result">
              <div className="resultLine">
                <span>✅ Fichier téléchargé :</span> <span className="link">{downloadName}</span>
              </div>
              <div className="hint" style={{ marginTop: "8px" }}>
                Si le téléchargement ne s’est pas lancé, réessayez (certains navigateurs bloquent
                parfois les downloads).
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
