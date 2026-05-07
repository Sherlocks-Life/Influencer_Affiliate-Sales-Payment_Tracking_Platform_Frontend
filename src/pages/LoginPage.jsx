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


         <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        }

        .login-wrapper {
          width: 100%;
          max-width: 28rem;
        }

        .login-card {
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .login-card:hover {
          box-shadow: 0 25px 30px -12px rgba(0, 0, 0, 0.25);
          transform: translateY(-2px);
        }

        /* Header Styles */
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .icon-lock {
          width: 2rem;
          height: 2rem;
          color: white;
        }

        .login-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Form Styles */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          outline: none;
          font-family: inherit;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-select {
          background-color: white;
          cursor: pointer;
        }

        /* Button Styles */
        .submit-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
          font-family: inherit;
        }

        .submit-button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .submit-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Loading Spinner */
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner-icon {
          width: 1.25rem;
          height: 1.25rem;
          animation: spin 1s linear infinite;
        }

        .spinner-circle {
          opacity: 0.25;
        }

        .spinner-path {
          opacity: 0.75;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Message Styles */
        .message {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-success {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message-error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Toggle Mode */
        .toggle-mode {
          margin-top: 1.5rem;
          text-align: center;
        }

        .toggle-button {
          background: none;
          border: none;
          color: #667eea;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .toggle-button:hover {
          color: #764ba2;
          text-decoration: underline;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .login-card {
            padding: 1.5rem;
          }

          .login-title {
            font-size: 1.5rem;
          }

          .login-icon {
            width: 3rem;
            height: 3rem;
          }

          .icon-lock {
            width: 1.5rem;
            height: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
