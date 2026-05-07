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
  PointElement
} from "chart.js";
import { api } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export function InfluencerDashboard({ session }) {
  const [profile, setProfile] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [weekendData, setWeekendData] = useState({ weekendRevenue: 0, weekdayRevenue: 0, bestDay: "" });
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    async function load() {
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
        labels: { font: { size: 11 } }
      }
    }
  };

  const weekendChart = {
    labels: ["Weekend", "Weekday"],
    datasets: [
      {
        label: "Revenue (Rs)",
        data: [weekendData.weekendRevenue, weekendData.weekdayRevenue],
        backgroundColor: ["#f59e0b", "#3b82f6"],
        borderWidth: 0
      }
    ]
  };

  const trendChart = {
    labels: trend.map((t, i) => `Sale ${i + 1}`),
    datasets: [
      {
        label: "Sale Amount (Rs)",
        data: trend.map((t) => t.amount),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.3,
        fill: true,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4
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
        borderRadius: 8
      }
    ]
  };

  if (!profile) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Influencer Dashboard</h1>
          <p style={styles.subtitle}>Track your performance, earnings & insights</p>
        </div>

        {/* Profile & Referral Section */}
        <div style={styles.profileSection}>
          <div style={styles.profileCard}>
            <h3 style={styles.cardTitle}>👋 Welcome, {profile?.name || "Influencer"}!</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Referral Code</div>
                <div style={styles.infoValue}>{profile?.referralCode || "—"}</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Conversion Rate</div>
                <div style={styles.infoValue}>{stats?.conversionRate || 0}%</div>
              </div>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Best Performing Day</div>
                <div style={styles.infoValue}>{weekendData.bestDay || "—"}</div>
              </div>
            </div>

            {profile?.referralCode && (
              <div style={styles.trackingLink}>
                <div style={styles.trackingLabel}>🔗 Your Tracking Link</div>
                <div style={styles.trackingUrl}>
                  {`${window.location.origin}/checkout/${profile.referralCode}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance Stats */}
        <div style={styles.statsSection}>
          <div style={styles.statsCard}>
            <h3 style={styles.cardTitle}>📊 Performance Overview</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{stats?.clicks || 0}</div>
                <div style={styles.statLabel}>Total Clicks</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{stats?.sales || 0}</div>
                <div style={styles.statLabel}>Total Sales</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>₹{stats?.revenue || 0}</div>
                <div style={styles.statLabel}>Total Revenue</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{stats?.conversionRate || 0}%</div>
                <div style={styles.statLabel}>Conversion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📈 Clicks vs Sales</h3>
            <div style={styles.chartBox}>
              <Bar data={clicksSalesChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>💰 Weekend vs Weekday Revenue</h3>
            <div style={styles.pieBox}>
              <Pie data={weekendChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📊 Recent Sales Trend</h3>
            <div style={styles.chartBox}>
              {trend.length > 0 ? (
                <Line data={trendChart} options={chartOptions} />
              ) : (
                <div style={styles.emptyState}>No recent sales data available</div>
              )}
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>🤖 AI Insights</h3>
            <div style={styles.insightsBox}>
              {insights.length === 0 ? (
                <p style={styles.emptyText}>No insights yet. Keep promoting to get personalized tips.</p>
              ) : (
                <ul style={styles.insightsList}>
                  {insights.map((x, i) => (
                    <li key={i} style={styles.insightItem}>
                      • {x}
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
            <h3 style={styles.cardTitle}>💳 Payment Status</h3>

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

                <h4 style={styles.recentTitle}>📋 Recent Updates</h4>
                <div style={styles.recentList}>
                  {(paymentSummary.lastPayments || []).slice(0, 5).map((p) => (
                    <div key={p.id} style={styles.recentItem}>
                      <div style={styles.recentHeader}>
                        <span style={{...styles.recentStatus, ...styles[`status${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`]}}>
                          {p.status}
                        </span>
                        <span style={styles.recentDate}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <div style={styles.recentAmount}>Commission: ₹{p.commission}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={styles.emptyText}>No payment status available yet.</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)",
    padding: "24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  wrapper: {
    maxWidth: "1400px",
    margin: "0 auto"
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "3px solid #3b82f6",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    color: "#475569",
    fontSize: "14px"
  },
  header: {
    marginBottom: "28px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #1e293b, #475569)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "8px"
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px"
  },
  profileSection: {
    marginBottom: "24px"
  },
  profileCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "20px"
  },
  infoItem: {
    textAlign: "center"
  },
  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "8px"
  },
  infoValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b"
  },
  trackingLink: {
    marginTop: "16px",
    padding: "16px",
    background: "#eff6ff",
    borderRadius: "12px",
    border: "1px solid #bfdbfe"
  },
  trackingLabel: {
    fontSize: "13px",
    color: "#1e40af",
    marginBottom: "8px",
    fontWeight: "500"
  },
  trackingUrl: {
    fontSize: "13px",
    fontFamily: "monospace",
    color: "#1e3a8a",
    wordBreak: "break-all"
  },
  statsSection: {
    marginBottom: "24px"
  },
  statsCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px"
  },
  statItem: {
    textAlign: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    borderRadius: "12px",
    transition: "transform 0.2s ease"
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px"
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b"
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "24px"
  },
  chartCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)"
  },
  chartTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "16px"
  },
  chartBox: {
    height: "300px"
  },
  pieBox: {
    height: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#94a3b8",
    fontSize: "14px"
  },
  insightsBox: {
    height: "300px",
    overflowY: "auto",
    padding: "8px"
  },
  insightsList: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  insightItem: {
    padding: "12px",
    marginBottom: "8px",
    background: "#f8fafc",
    borderRadius: "8px",
    color: "#475569",
    fontSize: "13px",
    lineHeight: "1.5"
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: "14px",
    textAlign: "center",
    padding: "40px"
  },
  paymentSection: {
    marginBottom: "24px"
  },
  paymentCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px"
  },
  statusItem: {
    textAlign: "center",
    padding: "16px",
    borderRadius: "12px",
    transition: "transform 0.2s ease"
  },
  statusPending: {
    background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)"
  },
  statusApproved: {
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)"
  },
  statusPaid: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
  },
  statusFailed: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
  },
  statusCount: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px"
  },
  statusLabel: {
    fontSize: "12px",
    textTransform: "capitalize"
  },
  recentTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "12px"
  },
  recentList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  recentItem: {
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    transition: "background 0.2s ease"
  },
  recentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px"
  },
  recentStatus: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
    padding: "2px 8px",
    borderRadius: "12px"
  },
  recentDate: {
    fontSize: "11px",
    color: "#64748b"
  },
  recentAmount: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#1e293b"
  }
};

// Add hover effects dynamically
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    .stat-item:hover, .status-item:hover, .recent-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .recent-item:hover {
      background: #f1f5f9;
    }
    button:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(styleSheet);
}
