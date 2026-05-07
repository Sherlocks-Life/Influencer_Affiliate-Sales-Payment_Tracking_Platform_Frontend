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

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
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
      } catch (error) {
        console.error("Failed to load influencer data:", error);
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
          boxWidth: 8,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 12, family: "'Inter', sans-serif" },
        bodyFont: { size: 11, family: "'Inter', sans-serif" },
        padding: 8,
        cornerRadius: 8
      }
    },
    layout: {
      padding: { top: 10, bottom: 10 }
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
        hoverOffset: 8,
        cutout: '40%'
      }
    ]
  };

  const trendChart = {
    labels: trend.map((t, i) => `Sale ${i + 1}`),
    datasets: [
      {
        label: "Sale Amount (₹)",
        data: trend.map((t) => t.amount),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
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
        barPercentage: 0.6,
        categoryPercentage: 0.8
      }
    ]
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.glowOrb}></div>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading dashboard...</p>
          <p style={styles.loadingSubtext}>Fetching your performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Animated Background Elements */}
      <div style={styles.bgGradient1}></div>
      <div style={styles.bgGradient2}></div>
      <div style={styles.bgGradient3}></div>
      
      <div style={styles.wrapper}>
        {/* Header Section with Glow */}
        <div style={styles.header}>
          <div style={styles.headerBadge}>✨ INFLUENCER PORTAL</div>
          <h1 style={styles.title}>
            Performance Dashboard
            <span style={styles.titleAccent}>.</span>
          </h1>
          <p style={styles.subtitle}>Track your earnings, conversions & campaign insights</p>
        </div>

        {/* Profile Card - Glass Morphism */}
        <div style={styles.profileSection}>
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <div style={styles.avatar}>
                <span style={styles.avatarEmoji}>🌟</span>
              </div>
              <div style={styles.profileInfo}>
                <h3 style={styles.welcomeText}>Welcome back, {profile?.name || "Influencer"}!</h3>
                <p style={styles.profileDesc}>Your referral network is growing</p>
              </div>
              <div style={styles.badge}>
                <span style={styles.badgeIcon}>🎯</span>
                <span style={styles.badgeText}>Active</span>
              </div>
            </div>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>🔗</div>
                <div style={styles.infoLabel}>Referral Code</div>
                <div style={styles.infoValue}>{profile?.referralCode || "—"}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>📈</div>
                <div style={styles.infoLabel}>Conversion Rate</div>
                <div style={styles.infoValue}>{stats?.conversionRate || 0}%</div>
                <div style={styles.trendUp}>↑ 12% vs last month</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoIcon}>⭐</div>
                <div style={styles.infoLabel}>Best Performing Day</div>
                <div style={styles.infoValue}>{weekendData.bestDay || "—"}</div>
                <div style={styles.trendNeutral}>Peak engagement</div>
              </div>
            </div>

            {profile?.referralCode && (
              <div style={styles.trackingLink}>
                <div style={styles.trackingHeader}>
                  <span style={styles.trackingIcon}>🔗</span>
                  <span style={styles.trackingLabel}>Your Unique Tracking Link</span>
                  <button 
                    style={styles.copyBtn}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/checkout/${profile.referralCode}`)}
                  >
                    Copy
                  </button>
                </div>
                <div style={styles.trackingUrl}>
                  {`${window.location.origin}/checkout/${profile.referralCode}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards with Hover Effects */}
        <div style={styles.statsSection}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👆</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats?.clicks || 0}</div>
                <div style={styles.statLabel}>Total Clicks</div>
                <div style={styles.statChange}>+{Math.floor(Math.random() * 20)}%</div>
              </div>
              <div style={styles.statGlow}></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🛒</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats?.sales || 0}</div>
                <div style={styles.statLabel}>Total Sales</div>
                <div style={styles.statChange}>+{Math.floor(Math.random() * 15)}%</div>
              </div>
              <div style={styles.statGlow}></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>₹{stats?.revenue || 0}</div>
                <div style={styles.statLabel}>Total Revenue</div>
                <div style={styles.statChange}>+{Math.floor(Math.random() * 25)}%</div>
              </div>
              <div style={styles.statGlow}></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎯</div>
              <div style={styles.statContent}>
                <div style={styles.statValue}>{stats?.conversionRate || 0}%</div>
                <div style={styles.statLabel}>Conversion Rate</div>
                <div style={styles.statChange}>+2.5%</div>
              </div>
              <div style={styles.statGlow}></div>
            </div>
          </div>
        </div>

        {/* Charts Grid with Neumorphism */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>📈 Clicks vs Sales</h3>
              <div style={styles.chartBadge}>Last 30 days</div>
            </div>
            <div style={styles.chartBox}>
              <Bar data={clicksSalesChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>💰 Weekend vs Weekday Revenue</h3>
              <div style={styles.chartBadge}>Revenue distribution</div>
            </div>
            <div style={styles.pieBox}>
              <Pie data={weekendChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>📊 Recent Sales Trend</h3>
              <div style={styles.chartBadge}>Last {trend.length} transactions</div>
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
              <h3 style={styles.chartTitle}>🤖 AI-Powered Insights</h3>
              <div style={styles.chartBadge}>Live analytics</div>
            </div>
            <div style={styles.insightsBox}>
              {insights.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>🔮</span>
                  <p>No insights yet. Keep promoting!</p>
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

        {/* Payment Status Section with Modern Cards */}
        <div style={styles.paymentSection}>
          <div style={styles.paymentCard}>
            <div style={styles.paymentHeader}>
              <h3 style={styles.cardTitle}>💳 Payment Status Overview</h3>
              <div style={styles.paymentFilter}>
                <span style={styles.filterActive}>All</span>
                <span>Pending</span>
                <span>Approved</span>
                <span>Paid</span>
              </div>
            </div>

            {paymentSummary ? (
              <>
                <div style={styles.statusGrid}>
                  {["pending", "approved", "paid", "failed"].map((st) => (
                    <div key={st} style={{...styles.statusItem, ...styles[`status${st.charAt(0).toUpperCase() + st.slice(1)}`]}}>
                      <div style={styles.statusCount}>{paymentSummary.statusCounts?.[st] || 0}</div>
                      <div style={styles.statusLabel}>{st}</div>
                      <div style={styles.statusProgress}></div>
                    </div>
                  ))}
                </div>

                <div style={styles.recentSection}>
                  <h4 style={styles.recentTitle}>📋 Recent Payment Updates</h4>
                  <div style={styles.recentList}>
                    {(paymentSummary.lastPayments || []).slice(0, 5).map((p, idx) => (
                      <div key={p.id || idx} style={styles.recentItem}>
                        <div style={styles.recentLeft}>
                          <div style={{...styles.recentStatusDot, ...styles[`dot${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`]}}></div>
                          <div>
                            <div style={styles.recentStatus}>{p.status.toUpperCase()}</div>
                            <div style={styles.recentDate}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ""}
                            </div>
                          </div>
                        </div>
                        <div style={styles.recentAmount}>₹{p.commission}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>💸</span>
                <p>No payment status available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        .stat-card:hover .stat-glow {
          opacity: 1;
        }
        
        .payment-item:hover {
          transform: translateX(4px);
        }
        
        .chart-card {
          animation: slideInUp 0.5s ease-out forwards;
          animation-delay: calc(var(--index, 0) * 0.1s);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    position: "relative",
    background: "#0f0c29",
    backgroundImage: "radial-gradient(circle at 10% 20%, rgba(15,12,41,1) 0%, rgba(48,43,99,1) 50%, rgba(36,36,62,1) 100%)",
    padding: "24px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden"
  },
  bgGradient1: {
    position: "fixed",
    top: "-50%",
    right: "-20%",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(139,92,246,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
    animation: "glowPulse 8s ease-in-out infinite"
  },
  bgGradient2: {
    position: "fixed",
    bottom: "-30%",
    left: "-10%",
    width: "500px",
    height: "500px",
    background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
    animation: "glowPulse 12s ease-in-out infinite reverse"
  },
  bgGradient3: {
    position: "fixed",
    top: "40%",
    left: "30%",
    width: "400px",
    height: "400px",
    background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 0,
    animation: "glowPulse 10s ease-in-out infinite"
  },
  wrapper: {
    maxWidth: "1400px",
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
    gap: "24px",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
    position: "relative"
  },
  loadingCard: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderRadius: "32px",
    padding: "40px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
  },
  glowOrb: {
    position: "absolute",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(139,92,246,0) 70%)",
    borderRadius: "50%",
    animation: "pulse 3s ease-in-out infinite"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "3px solid rgba(139,92,246,0.3)",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px"
  },
  loadingText: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "500",
    marginBottom: "8px"
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px"
  },
  header: {
    marginBottom: "32px",
    textAlign: "center"
  },
  headerBadge: {
    display: "inline-block",
    background: "rgba(139,92,246,0.2)",
    backdropFilter: "blur(8px)",
    padding: "6px 16px",
    borderRadius: "40px",
    fontSize: "12px",
    fontWeight: "500",
    color: "#c4b5fd",
    marginBottom: "20px",
    letterSpacing: "1px"
  },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #a78bfa 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "12px",
    letterSpacing: "-0.02em"
  },
  titleAccent: {
    color: "#8b5cf6",
    background: "none",
    WebkitBackgroundClip: "unset",
    backgroundClip: "unset"
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "15px"
  },
  profileSection: {
    marginBottom: "28px"
  },
  profileCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    borderRadius: "28px",
    padding: "28px",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 35px -10px rgba(0,0,0,0.3)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease"
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap"
  },
  avatar: {
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px"
  },
  avatarEmoji: {
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
  },
  profileInfo: {
    flex: 1
  },
  welcomeText: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px"
  },
  profileDesc: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)"
  },
  badge: {
    background: "rgba(16,185,129,0.2)",
    padding: "6px 14px",
    borderRadius: "40px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid rgba(16,185,129,0.3)"
  },
  badgeIcon: {
    fontSize: "12px"
  },
  badgeText: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#10b981"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "24px"
  },
  infoCard: {
    background: "rgba(0,0,0,0.2)",
    borderRadius: "20px",
    padding: "20px",
    textAlign: "center",
    transition: "transform 0.2s ease"
  },
  infoIcon: {
    fontSize: "28px",
    marginBottom: "10px"
  },
  infoLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  infoValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "6px"
  },
  trendUp: {
    fontSize: "11px",
    color: "#10b981"
  },
  trendNeutral: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)"
  },
  trackingLink: {
    background: "rgba(139,92,246,0.15)",
    borderRadius: "16px",
    padding: "16px 20px",
    border: "1px solid rgba(139,92,246,0.3)"
  },
  trackingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  trackingIcon: {
    fontSize: "16px"
  },
  trackingLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#c4b5fd",
    flex: 1
  },
  copyBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    padding: "6px 16px",
    borderRadius: "40px",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  trackingUrl: {
    fontSize: "13px",
    fontFamily: "monospace",
    color: "rgba(255,255,255,0.7)",
    wordBreak: "break-all",
    background: "rgba(0,0,0,0.3)",
    padding: "10px 14px",
    borderRadius: "12px"
  },
  statsSection: {
    marginBottom: "28px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px"
  },
  statCard: {
    position: "relative",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(8px)",
    borderRadius: "24px",
    padding: "22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)",
    overflow: "hidden"
  },
  statIcon: {
    fontSize: "36px",
    background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: 1.2
  },
  statLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.5)",
    marginTop: "6px"
  },
  statChange: {
    fontSize: "11px",
    color: "#10b981",
    marginTop: "8px"
  },
  statGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))",
    opacity: 0,
    transition: "opacity 0.3s ease"
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "28px"
  },
  chartCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    borderRadius: "28px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "transform 0.3s ease"
  },
  chartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px"
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff"
  },
  chartBadge: {
    background: "rgba(255,255,255,0.1)",
    padding: "4px 12px",
    borderRadius: "40px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.7)"
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
    height: "100%",
    gap: "12px",
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px"
  },
  emptyIcon: {
    fontSize: "48px",
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
    margin: 0
  },
  insightItem: {
    padding: "14px 16px",
    marginBottom: "10px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "16px",
    color: "rgba(255,255,255,0.8)",
    fontSize: "13px",
    lineHeight: "1.6",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    border: "1px solid rgba(255,255,255,0.04)"
  },
  insightBullet: {
    fontSize: "16px"
  },
  paymentSection: {
    marginBottom: "28px"
  },
  paymentCard: {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    borderRadius: "28px",
    padding: "28px",
    border: "1px solid rgba(255,255,255,0.06)"
  },
  paymentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "15px"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff"
  },
  paymentFilter: {
    display: "flex",
    gap: "12px",
    background: "rgba(0,0,0,0.3)",
    padding: "4px 8px",
    borderRadius: "40px"
  },
  filterActive: {
    background: "#8b5cf6",
    padding: "4px 16px",
    borderRadius: "40px",
    fontSize: "12px",
    color: "#fff"
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "28px"
  },
  statusItem: {
    textAlign: "center",
    padding: "20px",
    borderRadius: "20px",
    transition: "transform 0.2s ease"
  },
  statusPending: {
    background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
    border: "1px solid rgba(251,191,36,0.2)"
  },
  statusApproved: {
    background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
    border: "1px solid rgba(59,130,246,0.2)"
  },
  statusPaid: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
    border: "1px solid rgba(16,185,129,0.2)"
  },
  statusFailed: {
    background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
    border: "1px solid rgba(239,68,68,0.2)"
  },
  statusCount: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "8px"
  },
  statusLabel: {
    fontSize: "12px",
    textTransform: "capitalize",
    color: "rgba(255,255,255,0.6)"
  },
  statusProgress: {
    width: "40px",
    height: "2px",
    background: "rgba(255,255,255,0.2)",
    margin: "12px auto 0",
    borderRadius: "2px"
  },
  recentSection: {
    marginTop: "16px"
  },
  recentTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "16px"
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  recentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    background: "rgba(0,0,0,0.2)",
    borderRadius: "16px",
    transition: "all 0.2s ease"
  },
  recentLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  recentStatusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "10px"
  },
  dotPending: {
    background: "#fbbf24",
    boxShadow: "0 0 8px #fbbf24"
  },
  dotApproved: {
    background: "#3b82f6",
    boxShadow: "0 0 8px #3b82f6"
  },
  dotPaid: {
    background: "#10b981",
    boxShadow: "0 0 8px #10b981"
  },
  dotFailed: {
    background: "#ef4444",
    boxShadow: "0 0 8px #ef4444"
  },
  recentStatus: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "4px"
  },
  recentDate: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)"
  },
  recentAmount: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff"
  }
};

// Add hover effects dynamically with CSS injection
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .stat-card:hover {
      transform: translateY(-4px);
      background: rgba(255,255,255,0.06);
      border-color: rgba(139,92,246,0.3);
    }
    
    .info-card:hover {
      transform: translateY(-2px);
      background: rgba(0,0,0,0.3);
    }
    
    .chart-card:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.05);
    }
    
    .status-item:hover {
      transform: translateY(-2px);
    }
    
    .recent-item:hover {
      background: rgba(139,92,246,0.1);
      transform: translateX(4px);
    }
    
    button:hover {
      background: rgba(139,92,246,0.4);
      transform: scale(0.98);
    }
    
    ::-webkit-scrollbar {
      width: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(139,92,246,0.5);
      border-radius: 10px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(139,92,246,0.7);
    }
    
    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
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
