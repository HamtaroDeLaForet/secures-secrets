"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setErr("Mot de passe invalide.");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="page admin-login-page">
      <div className="container">
        <header className="hero">
          <h1>Administration</h1>
          <p>Connexion requise</p>
        </header>

        <fieldset className="fieldset">
          <legend>Accès admin</legend>

          <form onSubmit={submit} className="admin-login-form">
            <label className="label">Mot de passe</label>

            <input
              className="input"
              type="password"
              placeholder="Mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {err && <div className="alert alert-error">{err}</div>}

            <button className="btn" type="submit">
              Se connecter
            </button>
          </form>
        </fieldset>
      </div>
    </main>

  );
}
