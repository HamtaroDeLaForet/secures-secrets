"use client";

import { useMemo, useState } from "react";

type LifetimeOption = {
  label: string;
  minutes: number;
};

export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  const lifetimeOptions: LifetimeOption[] = useMemo(
    () => [
      { label: "15 minutes", minutes: 15 },
      { label: "1 heure", minutes: 60 },
      { label: "6 heures", minutes: 360 },
      { label: "1 jour", minutes: 1440 },
      { label: "7 jours", minutes: 10080 },
    ],
    []
  );

  const [secret, setSecret] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");

  const [expirationMode, setExpirationMode] = useState<"time" | "reads">("time");
  const [lifetimeMinutes, setLifetimeMinutes] = useState<number>(10080);
  const [maxReads, setMaxReads] = useState<string>("");

  const [shareUrl, setShareUrl] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function createSecret(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setShareUrl("");
    setErrorMessage("");

    if (!apiBase) {
      setStatus("error");
      setErrorMessage("NEXT_PUBLIC_API_BASE manquant (.env.local)");
      return;
    }

    if (!file && !secret.trim()) {
      setStatus("error");
      setErrorMessage("Veuillez coller un secret ou choisir un fichier.");
      return;
    }

    if (expirationMode === "reads") {
      const n = Number(maxReads);
      if (!Number.isFinite(n) || n < 1) {
        setStatus("error");
        setErrorMessage("Max lectures doit être un nombre >= 1.");
        return;
      }
    }

    try {
      let res: Response;

      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("password", password);

        if (expirationMode === "time") {
          fd.append("expires_in_minutes", String(lifetimeMinutes));
        } else {
          fd.append("max_reads", String(Number(maxReads)));
        }

        res = await fetch(`${apiBase}/secrets/`, {
          method: "POST",
          body: fd,
        });
      } else {
        const body: Record<string, unknown> = { secret, password };

        if (expirationMode === "time") {
          body.expires_in_minutes = lifetimeMinutes;
        } else {
          body.max_reads = Number(maxReads);
        }

        res = await fetch(`${apiBase}/secrets/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        let details = "";
        try {
          const errJson = await res.json();
          details = JSON.stringify(errJson);
        } catch {
        }
        setStatus("error");
        setErrorMessage(`Erreur API (${res.status})${details ? ` : ${details}` : ""}`);
        return;
      }

      const data: { id: string } = await res.json();
      const fullLink = `${window.location.origin}/s/${data.id}`;
      setShareUrl(fullLink);
      setStatus("done");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <h1>Collez votre mot de passe, message secret ou lien privé ci-dessous</h1>
          <p>Ne stockez aucune information confidentielle dans vos emails ou fils de discussion.</p>
        </header>

        <form onSubmit={createSecret} className="form">
          <div className="row">
            <label className="label">Fichier (optionnel) :</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                className="input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setFile(null)}
                  title="Retirer le fichier"
                >
                  Retirer
                </button>
              )}
            </div>
            {file && (
              <div className="hint" style={{ marginTop: "6px" }}>
                📎 {file.name} ({Math.ceil(file.size / 1024)} Ko)
              </div>
            )}
          </div>

          <textarea
            className="textarea"
            placeholder="Votre contenu secret est à coller ici (ou choisissez un fichier au-dessus)"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            required={!file}
            disabled={!!file}
          />

          <fieldset className="fieldset">
            <legend>Paramètres de confidentialité</legend>

            <div className="row">
              <label className="label">Mot de passe :</label>
              <input
                className="input"
                type="password"
                placeholder="Un mot ou une phrase qui est difficile à deviner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="row">
              <label className="label">Expiration :</label>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="expirationMode"
                    value="time"
                    checked={expirationMode === "time"}
                    onChange={() => setExpirationMode("time")}
                  />
                  Temps
                </label>

                <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="expirationMode"
                    value="reads"
                    checked={expirationMode === "reads"}
                    onChange={() => setExpirationMode("reads")}
                  />
                  Nombre de lectures
                </label>
              </div>
            </div>

            {expirationMode === "time" && (
              <div className="row">
                <label className="label">Lifetime :</label>
                <select
                  className="select"
                  value={String(lifetimeMinutes)}
                  onChange={(e) => setLifetimeMinutes(Number(e.target.value))}
                >
                  {lifetimeOptions.map((opt) => (
                    <option key={opt.minutes} value={opt.minutes}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {expirationMode === "reads" && (
              <div className="row">
                <label className="label">Max lectures :</label>
                <input
                  className="input"
                  inputMode="numeric"
                  placeholder="ex: 2"
                  value={maxReads}
                  onChange={(e) => setMaxReads(e.target.value)}
                  required
                />
              </div>
            )}
          </fieldset>

          <button className="cta" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Création..." : "Créer un lien secret*"}
          </button>

          {status === "error" && <div className="alert alert-error">❌ {errorMessage}</div>}

          {shareUrl && (
            <div className="result">
              <div className="resultLine">
                <span>Lien :</span>
                <a className="link" href={shareUrl}>
                  {shareUrl}
                </a>
              </div>

              <button type="button" className="btn" onClick={copyLink}>
                Copier le lien
              </button>

              <div className="hint">
                ⚠️ Le mot de passe n’est jamais stocké. Partage le mot de passe via un canal différent du lien.
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
