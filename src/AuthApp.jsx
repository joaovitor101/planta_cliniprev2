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
    <div style={{ width: "100%", maxWidth: 320, alignSelf: "center", display: "flex", flexDirection: "column" }}>
      <header style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: "#111827" }}>Login</h1>
          <span style={{ fontSize: 14, color: "#6b7280" }}>Entre para acessar as plantas</span>
          {errorMsg ? <span style={{ color: "#b91c1c", marginTop: 8 }}>{errorMsg}</span> : null}
        </div>
      </header>

      <form 
        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy && password) {
            handleAuth(login);
          }
        }}
      >
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

        <div className="field-group">
          <button
            type="submit"
            className="button button-primary"
            disabled={busy || !password}
            style={{ width: "100%", justifyContent: "center", padding: "10px 14px" }}
          >
            {busy ? "Aguarde..." : "Entrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AuthApp;

