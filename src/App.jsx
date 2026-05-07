import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Wallet,
  Users,
  Sparkles
} from "lucide-react";

import "./App.css";

import { setAuthToken } from "./api";
import { LoginPage } from "./pages/LoginPage.jsx";
import { AdminDashboard } from "./pages/AdminDashboard.jsx";
import { FinanceDashboard } from "./pages/FinanceDashboard.jsx";
import { InfluencerDashboard } from "./pages/InfluencerDashboard.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";

export default function App() {
  const location = useLocation();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOAD SESSION ON FIRST LOAD
  useEffect(() => {
    try {
      const raw = localStorage.getItem("session");
      const parsed = raw ? JSON.parse(raw) : null;

      setSession(parsed);

      if (parsed?.token) {
        setAuthToken(parsed.token);
      }
    } catch (err) {
      console.log("Session parse error", err);
      localStorage.removeItem("session");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ KEEP AUTH HEADER SYNCED
  useEffect(() => {
    if (session?.token) {
      setAuthToken(session.token);
    }
  }, [session]);

  const onLogin = (next) => {
    localStorage.setItem("session", JSON.stringify(next));
    setSession(next);
  };

  const onLogout = () => {
    localStorage.removeItem("session");
    setSession(null);
    setAuthToken("");
  };

  // ✅ LOADING STATE (prevents flicker + socket spam)
  if (loading) {
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );
  }

  // ✅ NOT LOGGED IN ROUTES
  if (!session) {
    return (
      <Routes>
        <Route path="/checkout/:referralCode" element={<CheckoutPage />} />
        <Route path="*" element={<LoginPage onLogin={onLogin} />} />
      </Routes>
    );
  }

  // ✅ ROLE DASHBOARD ROUTER
  const getDashboard = () => {
    switch (session.role) {
      case "admin":
        return <AdminDashboard session={session} />;

      case "finance":
        return <FinanceDashboard session={session} />;

      default:
        return <InfluencerDashboard session={session} />;
    }
  };

  const roleClass =
    session.role === "admin"
      ? "role-admin"
      : session.role === "finance"
      ? "role-finance"
      : "role-influencer";

  return (
    <div className="app">

      {/* BACKGROUND */}
      <div className="bg-circle blue"></div>
      <div className="bg-circle purple"></div>

      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-left">

          <div className="logo-box">
            <Sparkles size={22} />
          </div>

          <div>
            <h1>Influencer AI Platform</h1>
            <p>Smart Affiliate Dashboard</p>
          </div>
        </div>

        <div className="navbar-right">

          {/* ROLE */}
          <div className={`role-badge ${roleClass}`}>
            {session.role === "admin" && <ShieldCheck size={15} />}
            {session.role === "finance" && <Wallet size={15} />}
            {session.role === "influencer" && <Users size={15} />}
            {session.role.toUpperCase()}
          </div>

          {/* DASHBOARD */}
          <Link
            to="/"
            className={`nav-btn ${location.pathname === "/" ? "active-link" : ""}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* LOGOUT */}
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="main-container">
        <Routes>
          <Route path="/" element={getDashboard()} />
          <Route path="/checkout/:referralCode" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
