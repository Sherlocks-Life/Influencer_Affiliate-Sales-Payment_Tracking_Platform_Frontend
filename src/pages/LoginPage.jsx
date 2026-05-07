import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .login-wrapper {
    width: 100%;
    max-width: 440px;
    animation: fadeInUp 0.6s ease-out;
    margin: auto;
  }

  .login-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    padding: 48px 40px;
    box-shadow: 0 20px 60px -12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .login-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 25px 70px -12px rgba(0, 0, 0, 0.35);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-icon {
    font-size: 56px;
    display: inline-block;
    margin-bottom: 16px;
    animation: bounce 2.5s ease-in-out infinite;
  }

  .login-title {
    font-size: 32px;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .login-subtitle {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 24px;
  }

  .form-input {
    width: 100%;
    padding: 14px 18px;
    font-size: 15px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    transition: all 0.3s ease;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }

  .form-input:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
    background: white;
    transform: translateY(-1px);
  }

  .form-input::placeholder {
    color: #a0aec0;
    font-weight: 400;
  }

  select.form-input {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%23667eea'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M7 7l6 6 6-6'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 18px;
    padding-right: 40px;
  }

  .submit-button {
    width: 100%;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    margin-top: 8px;
    letter-spacing: 0.3px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
  }

  .submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }

  .submit-button:hover:not(:disabled)::before {
    left: 100%;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px -5px rgba(102, 126, 234, 0.35);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  .message-error {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 20px;
    border: 1px solid #fca5a5;
    animation: shake 0.4s ease-out;
  }

  .message-success {
    background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
    color: #0c4a6e;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 20px;
    border: 1px solid #bae6fd;
    animation: slideIn 0.3s ease-out;
  }

  .toggle-button {
    width: 100%;
    background: transparent;
    border: none;
    color: #667eea;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 12px;
    transition: all 0.3s ease;
    font-family: inherit;
    border-radius: 12px;
    text-align: center;
  }

  .toggle-button:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
    color: #5a67d8;
    transform: translateY(-1px);
  }

  .toggle-button:active {
    transform: translateY(0);
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .login-wrapper {
      max-width: 100%;
    }
    
    .login-card {
      padding: 36px 24px;
      border-radius: 20px;
    }
    
    .login-title {
      font-size: 28px;
    }
    
    .login-icon {
      font-size: 48px;
    }

    .form-input {
      padding: 12px 14px;
      font-size: 15px;
    }
    
    .submit-button {
      padding: 12px 20px;
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 28px 20px;
      border-radius: 16px;
    }
    
    .login-icon {
      font-size: 44px;
      margin-bottom: 12px;
    }
    
    .login-title {
      font-size: 24px;
    }

    .login-subtitle {
      font-size: 13px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .login-card {
      background: rgba(30, 41, 59, 0.95);
    }
    
    .login-title {
      color: #f1f5f9;
    }
    
    .login-subtitle {
      color: #cbd5e1;
    }
    
    .form-input {
      background: #1e293b;
      border-color: #334155;
      color: #f1f5f9;
    }
    
    .form-input:hover {
      border-color: #475569;
      background: #0f172a;
    }
    
    .form-input:focus {
      border-color: #667eea;
      background: #1e293b;
    }
    
    .form-input::placeholder {
      color: #64748b;
    }
    
    .toggle-button:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .message-success {
      background: #1e3a8a;
      color: #bfdbfe;
      border-color: #3b82f6;
    }

    .message-error {
      background: #7f1d1d;
      color: #fecaca;
      border-color: #dc2626;
    }
  }
`;

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [isLoading, setIsLoading] = useState(false);

  // Inject styles when component mounts
  useEffect(() => {
    // Check if styles already exist
    if (!document.getElementById('login-page-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'login-page-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }

    // Cleanup function to remove styles when component unmounts
    return () => {
      const styleElement = document.getElementById('login-page-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        await api.post("/auth/signup", { email, password, role });

        setMessageType("success");
        setMessage("✅ Signup successful! Please login.");
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

      setMessageType("error");
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
                ? "Sign in to continue to your account"
                : "Create a new account to get started"}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={submit} className="login-form">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              autoComplete="email"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "signup" && (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-input"
              >
                <option value="admin">👑 Admin</option>
                <option value="finance">💰 Finance</option>
                <option value="influencer">⭐ Influencer</option>
              </select>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* MESSAGE */}
          {message && (
            <div className={`message-${messageType}`}>
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
              ? "🆕 Create new account"
              : "🔙 Already have an account? Sign In"}
          </button>

        </div>
      </div>
    </div>
  );
}