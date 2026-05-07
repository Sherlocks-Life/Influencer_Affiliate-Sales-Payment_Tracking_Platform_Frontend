import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const styles = `
  /* Modern CSS styles for LoginPage component */
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .login-wrapper {
    width: 100%;
    max-width: 440px;
    animation: fadeInUp 0.6s ease-out;
  }

  .login-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 32px;
    padding: 48px 40px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .login-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.35);
  }

  .login-header {
    text-align: center;
    margin-bottom: 36px;
  }

  .login-icon {
    font-size: 56px;
    display: inline-block;
    margin-bottom: 16px;
    animation: bounce 2s infinite;
  }

  .login-title {
    font-size: 32px;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .login-subtitle {
    font-size: 14px;
    color: #718096;
    margin: 0;
    font-weight: 500;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .form-input {
    width: 100%;
    padding: 14px 18px;
    font-size: 16px;
    border: 2px solid #e2e8f0;
    border-radius: 16px;
    background: white;
    transition: all 0.3s ease;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }

  .form-input:hover {
    border-color: #cbd5e1;
  }

  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
  }

  .form-input::placeholder {
    color: #a0aec0;
    font-weight: 400;
  }

  select.form-input {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234a5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 20px;
  }

  .submit-button {
    width: 100%;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: inherit;
    margin-top: 8px;
    letter-spacing: 0.3px;
    position: relative;
    overflow: hidden;
  }

  .submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .submit-button:hover::before {
    left: 100%;
  }

  .submit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
  }

  .submit-button:active {
    transform: translateY(0);
  }

  .submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .message-error {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    color: #991b1b;
    padding: 14px 18px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 20px;
    border: 1px solid #fca5a5;
    animation: shake 0.5s ease-out;
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
  }

  .toggle-button:hover {
    background: #f7fafc;
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
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .login-wrapper {
      max-width: 100%;
    }
    
    .login-card {
      padding: 36px 24px;
    }
    
    .login-title {
      font-size: 28px;
    }
    
    .form-input {
      padding: 12px 16px;
      font-size: 14px;
    }
    
    .submit-button {
      padding: 12px 20px;
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 28px 20px;
    }
    
    .login-icon {
      font-size: 44px;
    }
    
    .login-title {
      font-size: 24px;
    }
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .login-card {
      background: rgba(26, 32, 44, 0.98);
    }
    
    .login-title {
      color: #f7fafc;
    }
    
    .login-subtitle {
      color: #a0aec0;
    }
    
    .form-input {
      background: #2d3748;
      border-color: #4a5568;
      color: #f7fafc;
    }
    
    .form-input:hover {
      border-color: #718096;
    }
    
    .form-input:focus {
      border-color: #667eea;
    }
    
    .form-input::placeholder {
      color: #718096;
    }
    
    .toggle-button:hover {
      background: #2d3748;
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
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
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
    </>
  );
}
