import React, { useEffect, useState } from "react";
import AppNew from "./AppNew.jsx";
import { login } from "./api/auth";

function AuthApp() {
  const [authToken, setAuthToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("authToken") || "";
    setAuthToken(token);
  }, []);

  const handleAuth = async (fn) => {
    if (busy) return;
    setErrorMsg("");
    setBusy(true);
    try {
      const res = await fn({ password });
      const token = res?.token;
      if (!token) throw new Error("Resposta do servidor sem token.");
      localStorage.setItem("authToken", token);
      setAuthToken(token);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Erro ao autenticar.";
      setErrorMsg(message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };

  if (authToken) {
    return (
      <div>
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 80 }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={handleLogout}
            style={{ background: "#fff" }}
          >
            Sair
          </button>
        </div>
        <AppNew />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ maxWidth: 560, maxHeight: "30vh", margin: "28px auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <header className="app-header">
        <div className="app-title">
          <h1>Login</h1>
          <span>Entre para acessar as plantas</span>
          {errorMsg ? <span style={{ color: "#b91c1c" }}>{errorMsg}</span> : null}
        </div>
      </header>

      <main className="modal-body" style={{ padding: 20 }}>
        <div className="field-group">
          <label className="field-label" htmlFor="auth-password">
            Senha
          </label>
          <input
            id="auth-password"
            className="field-input"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            disabled={busy}
          />
        </div>

        <div className="field-group" style={{ marginTop: 6 }}>
          <button
            type="button"
            className="button button-primary"
            onClick={() => handleAuth(login)}
            disabled={busy || !password}
          >
            {busy ? "Aguarde..." : "Entrar"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default AuthApp;

