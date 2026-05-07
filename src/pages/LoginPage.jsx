import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await api.post("/auth/signup", { email, password, role });

        setMessage("Signup successful. Please login.");
        setMode("login");
        setEmail("");
        setPassword("");
        setIsLoading(false);
        return;
      }

      const res = await api.post("/auth/login", { email, password });

      // ✅ SAFE RESPONSE HANDLING
      const session = res.data?.data || res.data;

      if (!session?.token) {
        throw new Error("Invalid login response");
      }

      // store session
      localStorage.setItem("session", JSON.stringify(session));

      // set auth token for API
      api.defaults.headers.common.Authorization = `Bearer ${session.token}`;

      // update app state
      onLogin(session);

      // redirect to dashboard
      navigate("/");

    } catch (error) {
      console.error(error);

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Try again.";

      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">

          {/* HEADER */}
          <div className="login-header">
            <div className="login-icon">
              🔐
            </div>

            <h1 className="login-title">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h1>

            <p className="login-subtitle">
              {mode === "login"
                ? "Sign in to continue"
                : "Create a new account"}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={submit} className="login-form">

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />

            {mode === "signup" && (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
                <option value="influencer">Influencer</option>
              </select>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? "Loading..." : mode === "login" ? "Login" : "Signup"}
            </button>
          </form>

          {/* MESSAGE */}
          {message && (
            <div className="message-error">
              {message}
            </div>
          )}

          {/* TOGGLE */}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
            }}
            className="toggle-button"
          >
            {mode === "login"
              ? "Create new account"
              : "Already have account?"}
          </button>

        </div>
      </div>
    </div>
  );
}
