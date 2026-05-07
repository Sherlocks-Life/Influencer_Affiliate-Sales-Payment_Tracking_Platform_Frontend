import { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  ArcElement,
  LineElement,
  PointElement,
  Filler
} from "chart.js";
import { api } from "../api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

export function InfluencerDashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [weekendData, setWeekendData] = useState({ weekendRevenue: 0, weekdayRevenue: 0, bestDay: "" });
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const { data: me } = await api.get(`/influencer/me/${session.userId}`);
        setProfile(me);

        if (me?._id) {
          const [{ data: s }, { data: ins }, { data: paySum }] = await Promise.all([
            api.get(`/analytics/influencer/${me._id}`),
            api.get(`/analytics/influencer/${me._id}/insights`),
            api.get(`/payment/status/summary`)
          ]);

          setPaymentSummary(paySum);
          setStats(s);
          setInsights(ins.insights || []);
          setWeekendData({
            weekendRevenue: ins.weekendRevenue || 0,
            weekdayRevenue: ins.weekdayRevenue || 0,
            bestDay: ins.bestDay || ""
          });
          setTrend(ins.recentSales || []);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load influencer data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [session.userId]);

  const chartOptions = {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { 
          font: { size: 11, family: "'Inter', sans-serif" },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        padding: 10,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(203, 213, 225, 0.2)',
          drawBorder: false
        },
        ticks: {
          font: { size: 10, family: "'Inter', sans-serif" }
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, family: "'Inter', sans-serif" }
        }
      }
    }
  };

  const weekendChart = {
    labels: ["Weekend", "Weekday"],
    datasets: [
      {
        label: "Revenue (₹)",
        data: [weekendData.weekendRevenue, weekendData.weekdayRevenue],
        backgroundColor: ["#f59e0b", "#3b82f6"],
        borderWidth: 0,
        hoverOffset: 8
      }
    ]
  };

  const trendChart = {
    labels: trend.map((_, i) => `Sale ${i + 1}`),
    datasets: [
      {
        label: "Sale Amount (₹)",
        data: trend.map((t) => t.amount),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.08)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5
      }
    ]
  };

  const clicksSalesChart = {
    labels: ["Clicks", "Sales"],
    datasets: [
      {
        label: "Count",
        data: [stats?.clicks || 0, stats?.sales || 0],
        backgroundColor: ["#60a5fa", "#2563eb"],
        borderRadius: 12,
        barPercentage: 0.65,
        categoryPercentage: 0.8
      }
    ]
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinnerWrapper}>
          <div style={styles.spinner}></div>
          <div style={styles.spinnerRing}></div>
        </div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <p style={styles.errorText}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgGradient}></div>
      <div style={styles.wrapper}>
        {/* Header Section */}
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>Influencer Dashboard</h1>
              <p style={styles.subtitle}>Track your performance, earnings & insights</p>
            </div>
            <div style={styles.headerBadge}>
              <span style={styles.badgeIcon}>✨</span>
              <span style={styles.badgeText}>Pro Analytics</span>
            </div>
          </div>
        </header>

        {/* Profile Section */}
        <div style={styles.profileSection}>
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div style={styles.avatarWrapper}>
                <div style={styles.avatar}>
                  {profile?.name?.charAt(0) || "I"}
                </div>
              </div>
              <div style={styles.profileInfo}>
                <h3 style={styles.welcomeText}>Welcome back, {profile?.name || "Influencer"}!</h3>
                <div style={styles.profileMeta}>
                  <span style={styles.metaBadge}>⭐ Verified Partner</span>
                </div>
              </div>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>🔗</div>
                <div style={styles.infoLabel}>Referral Code</div>
                <div style={styles.infoValue}>{profile?.referralCode || "—"}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>📊</div>
                <div style={styles.infoLabel}>Conversion Rate</div>
                <div style={styles.infoValue}>{stats?.conversionRate || 0}%</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoIcon}>🌟</div>
                <div style={styles.infoLabel}>Best Performing Day</div>
                <div style={styles.infoValue}>{weekendData.bestDay || "—"}</div>
              </div>
            </div>

            {profile?.referralCode && (
              <div style={styles.trackingLink}>
                <div style={styles.trackingHeader}>
                  <span style={styles.trackingIcon}>🔗</span>
                  <span style={styles.trackingLabel}>Your Tracking Link</span>
                </div>
                <div style={styles.trackingUrl}>
                  {`${window.location.origin}/checkout/${profile.referralCode}`}
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/checkout/${profile.referralCode}`)}
                    style={styles.copyButton}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🖱️</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats?.clicks || 0}</div>
              <div style={styles.statLabel}>Total Clicks</div>
              <div style={styles.statTrend}>+12% vs last week</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🛒</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats?.sales || 0}</div>
              <div style={styles.statLabel}>Total Sales</div>
              <div style={styles.statTrend}>+8% vs last week</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>₹{stats?.revenue || 0}</div>
              <div style={styles.statLabel}>Total Revenue</div>
              <div style={styles.statTrend}>+15% vs last week</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📈</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats?.conversionRate || 0}%</div>
              <div style={styles.statLabel}>Conversion Rate</div>
              <div style={styles.statTrend}>+2.3% vs last week</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>📈 Clicks vs Sales</h3>
              <span style={styles.chartPeriod}>Last 30 days</span>
            </div>
            <div style={styles.chartBox}>
              <Bar data={clicksSalesChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>💰 Weekend vs Weekday Revenue</h3>
              <span style={styles.chartPeriod}>Performance comparison</span>
            </div>
            <div style={styles.pieBox}>
              <Pie data={weekendChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>📊 Recent Sales Trend</h3>
              <span style={styles.chartPeriod}>Last 7 transactions</span>
            </div>
            <div style={styles.chartBox}>
              {trend.length > 0 ? (
                <Line data={trendChart} options={chartOptions} />
              ) : (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>📭</span>
                  <p>No recent sales data available</p>
                </div>
              )}
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>🤖 AI Insights</h3>
              <span style={styles.aiBadge}>Powered by AI</span>
            </div>
            <div style={styles.insightsBox}>
              {insights.length === 0 ? (
                <div style={styles.emptyInsights}>
                  <span style={styles.emptyIcon}>💡</span>
                  <p>No insights yet. Keep promoting to get personalized tips.</p>
                </div>
              ) : (
                <ul style={styles.insightsList}>
                  {insights.map((x, i) => (
                    <li key={i} style={styles.insightItem}>
                      <span style={styles.insightBullet}>✨</span>
                      {x}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Payment Status Section */}
        <div style={styles.paymentSection}>
          <div style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <h3 style={styles.cardTitle}>💳 Payment Status</h3>
              <span style={styles.paymentUpdateBadge}>Live updates</span>
            </div>

            {paymentSummary ? (
              <>
                <div style={styles.statusGrid}>
                  {["pending", "approved", "paid", "failed"].map((st) => (
                    <div key={st} style={{...styles.statusItem, ...styles[`status${st.charAt(0).toUpperCase() + st.slice(1)}`]}}>
                      <div style={styles.statusCount}>{paymentSummary.statusCounts?.[st] || 0}</div>
                      <div style={styles.statusLabel}>{st}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.recentSection}>
                  <h4 style={styles.recentTitle}>📋 Recent Updates</h4>
                  <div style={styles.recentList}>
                    {(paymentSummary.lastPayments || []).slice(0, 5).map((p) => (
                      <div key={p.id} style={styles.recentItem}>
                        <div style={styles.recentIcon}>
                          {p.status === 'paid' ? '✅' : p.status === 'approved' ? '📝' : p.status === 'failed' ? '❌' : '⏳'}
                        </div>
                        <div style={styles.recentContent}>
                          <div style={styles.recentHeader}>
                            <span style={{...styles.recentStatus, ...styles[`status${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`]}}>
                              {p.status}
                            </span>
                            <span style={styles.recentDate}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                            </span>
                          </div>
                          <div style={styles.recentAmount}>Commission: ₹{p.commission}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>💳</span>
                <p>No payment status available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    position: "relative",
    backgroundColor: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "24px",
    overflowX: "hidden"
  },
  bgGradient: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.03) 0%, rgba(16, 185, 129, 0.02) 50%, rgba(245, 158, 11, 0.01) 100%)",
    pointerEvents: "none",
    zIndex: 0
  },
  wrapper: {
    maxWidth: "1440px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)"
  },
  spinnerWrapper: {
    position: "relative",
    width: "60px",
    height: "60px"
  },
  spinner: {
    position: "absolute",
    width: "48px",
    height: "48px",
    border: "3px solid #3b82f6",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  spinnerRing: {
    position: "absolute",
    width: "60px",
    height: "60px",
    border: "2px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "50%",
    top: "-6px",
    left: "-6px"
  },
  loadingText: {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "500"
  },
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
  },
  errorIcon: {
    fontSize: "48px"
  },
  errorText: {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: "500",
    maxWidth: "400px",
    textAlign: "center"
  },
  retryButton: {
    padding: "10px 24px",
    background: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "100px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  header: {
    marginBottom: "32px",
    animation: "fadeInDown 0.5s ease-out"
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: "clamp(24px, 5vw, 36px)",
    fontWeight: "800",
    background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "8px",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "400"
  },
  headerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    background: "rgba(37, 99, 235, 0.1)",
    borderRadius: "100px",
    backdropFilter: "blur(4px)",
    border: "1px solid rgba(37, 99, 235, 0.2)"
  },
  badgeIcon: {
    fontSize: "14px"
  },
  badgeText: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#2563eb"
  },
  profileSection: {
    marginBottom: "32px",
    animation: "fadeInUp 0.5s ease-out 0.1s both"
  },
  profileCard: {
    background: "white",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 35px -12px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(226, 232, 240, 0.6)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease"
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "28px",
    flexWrap: "wrap"
  },
  avatarWrapper: {
    position: "relative"
  },
  avatar: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    fontWeight: "600",
    color: "white",
    boxShadow: "0 8px 20px -6px rgba(59, 130, 246, 0.4)"
  },
  profileInfo: {
    flex: 1
  },
  welcomeText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px"
  },
  profileMeta: {
    display: "flex",
    gap: "8px"
  },
  metaBadge: {
    fontSize: "12px",
    padding: "2px 10px",
    background: "#fef3c7",
    color: "#d97706",
    borderRadius: "100px",
    fontWeight: "500"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "24px"
  },
  infoItem: {
    textAlign: "center",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "20px",
    transition: "all 0.2s ease"
  },
  infoIcon: {
    fontSize: "24px",
    marginBottom: "8px"
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#64748b",
    marginBottom: "6px"
  },
  infoValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a"
  },
  trackingLink: {
    marginTop: "8px",
    padding: "20px",
    background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
    borderRadius: "20px",
    border: "1px solid #bfdbfe"
  },
  trackingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px"
  },
  trackingIcon: {
    fontSize: "16px"
  },
  trackingLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e40af"
  },
  trackingUrl: {
    fontSize: "13px",
    fontFamily: "monospace",
    color: "#1e3a8a",
    wordBreak: "break-all",
    background: "rgba(255, 255, 255, 0.6)",
    padding: "12px 16px",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },
  copyButton: {
    padding: "6px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  statCard: {
    background: "white",
    borderRadius: "24px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    transition: "all 0.25s ease"
  },
  statIcon: {
    width: "52px",
    height: "52px",
    background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 1.2,
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
    marginBottom: "4px"
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "600"
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
    marginBottom: "32px"
  },
  chartCard: {
    background: "white",
    borderRadius: "28px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease"
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "8px"
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a"
  },
  chartPeriod: {
    fontSize: "11px",
    color: "#94a3b8",
    background: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "100px"
  },
  aiBadge: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#7c3aed",
    background: "#ede9fe",
    padding: "4px 10px",
    borderRadius: "100px"
  },
  chartBox: {
    height: "280px",
    position: "relative"
  },
  pieBox: {
    height: "280px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "240px",
    color: "#94a3b8",
    fontSize: "13px",
    gap: "12px"
  },
  emptyIcon: {
    fontSize: "40px",
    opacity: 0.5
  },
  insightsBox: {
    height: "280px",
    overflowY: "auto",
    padding: "4px"
  },
  insightsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  insightItem: {
    padding: "14px 16px",
    background: "#f8fafc",
    borderRadius: "16px",
    color: "#1e293b",
    fontSize: "13px",
    lineHeight: "1.5",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    transition: "all 0.2s ease"
  },
  insightBullet: {
    fontSize: "14px",
    flexShrink: 0
  },
  emptyInsights: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "240px",
    gap: "12px",
    color: "#94a3b8"
  },
  paymentSection: {
    marginBottom: "16px"
  },
  paymentCard: {
    background: "white",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
    border: "1px solid #e2e8f0"
  },
  paymentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a"
  },
  paymentUpdateBadge: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#16a34a",
    background: "#dcfce7",
    padding: "4px 12px",
    borderRadius: "100px"
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "16px",
    marginBottom: "28px"
  },
  statusItem: {
    textAlign: "center",
    padding: "20px 12px",
    borderRadius: "20px",
    transition: "all 0.2s ease",
    cursor: "default"
  },
  statusPending: {
    background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
    border: "1px solid #fde68a"
  },
  statusApproved: {
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "1px solid #bfdbfe"
  },
  statusPaid: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "1px solid #bbf7d0"
  },
  statusFailed: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "1px solid #fecaca"
  },
  statusCount: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "8px",
    color: "#0f172a"
  },
  statusLabel: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#475569"
  },
  recentSection: {
    marginTop: "8px"
  },
  recentTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "16px"
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  recentItem: {
    display: "flex",
    gap: "14px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "18px",
    transition: "all 0.2s ease"
  },
  recentIcon: {
    fontSize: "20px",
    flexShrink: 0
  },
  recentContent: {
    flex: 1
  },
  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    flexWrap: "wrap",
    gap: "6px"
  },
  recentStatus: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "capitalize",
    padding: "2px 10px",
    borderRadius: "100px",
    display: "inline-block"
  },
  recentDate: {
    fontSize: "10px",
    color: "#94a3b8"
  },
  recentAmount: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a"
  }
};

// Inject global animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.12);
    }
    .chart-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.1);
    }
    .status-item:hover {
      transform: translateY(-2px);
    }
    .recent-item:hover {
      background: #f1f5f9;
      transform: translateX(2px);
    }
    .info-item:hover {
      transform: translateY(-2px);
      background: #f1f5f9;
    }
    .insight-item:hover {
      background: #f1f5f9;
      transform: translateX(4px);
    }
    .copy-button:hover {
      background: #1d4ed8;
      transform: scale(1.02);
    }
    .retry-button:hover {
      background: #b91c1c;
      transform: scale(1.02);
    }
    
    /* Custom scrollbar */
    .insights-box::-webkit-scrollbar {
      width: 4px;
    }
    .insights-box::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }
    .insights-box::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .status-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
