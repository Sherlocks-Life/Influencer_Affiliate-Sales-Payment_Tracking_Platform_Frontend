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

  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("session");

    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setAuthToken(session?.token || "");
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

  if (!session) {
    return (
      <Routes>
        <Route path="/checkout/:referralCode" element={<CheckoutPage />} />
        <Route path="*" element={<LoginPage onLogin={onLogin} />} />
      </Routes>
    );
  }

  const getDashboard = () => {
    if (session.role === "admin") {
      return <AdminDashboard session={session} />;
    }

    if (session.role === "finance") {
      return <FinanceDashboard session={session} />;
    }

    return <InfluencerDashboard session={session} />;
  };

  const roleClass =
    session.role === "admin"
      ? "role-admin"
      : session.role === "finance"
      ? "role-finance"
      : "role-influencer";

  return (
    <div className="app">

      {/* BACKGROUND EFFECTS */}
      <div className="bg-circle blue"></div>
      <div className="bg-circle purple"></div>

      {/* HEADER */}
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

          {/* ROLE BADGE */}
          <div className={`role-badge ${roleClass}`}>
            {session.role === "admin" && <ShieldCheck size={15} />}
            {session.role === "finance" && <Wallet size={15} />}
            {session.role === "influencer" && <Users size={15} />}
            {session.role.toUpperCase()}
          </div>

          {/* DASHBOARD BUTTON */}
          <Link
            to="/"
            className={`nav-btn ${
              location.pathname === "/" ? "active-link" : ""
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* LOGOUT BUTTON */}
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
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