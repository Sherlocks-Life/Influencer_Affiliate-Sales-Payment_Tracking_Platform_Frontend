import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { api } from "../api";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const socket = io(import.meta.env.VITE_API_ROOT || "http://localhost:5000");

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function FinanceDashboard() {
  const [overview, setOverview] = useState(null);
  const [prediction7, setPrediction7] = useState([]);
  const [prediction30, setPrediction30] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);

  const load = async () => {
    try {
      const [a, c, c30, e] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/sales-prediction"),
        api.get("/analytics/sales-prediction?days=30"),
        api.get("/payment/history")
      ]);
      setOverview(a.data);
      setPrediction7(c.data.prediction || []);
      setPrediction30(c30.data.prediction || []);
      setPayments(e.data || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const paymentNow = async (id) => {
    try {
      setLoadingAction(true);
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) throw new Error("Failed to load Razorpay SDK");

      const { data: checkoutData } = await api.post(`/payment/checkout/create/${id}`);

      const keyId = checkoutData?.keyId;
      const useMock = !keyId || !String(keyId).startsWith("rzp_");

      if (useMock) {
        await api.post(`/payment/checkout/verify/${id}`, {
          orderId: checkoutData.orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature"
        });
        await load();
        setLoadingAction(false);
        return;
      }

      const options = {
        key: keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: "Influencer Affiliate Platform",
        description: "Commission Payment",
        order_id: checkoutData.orderId,
        theme: { color: "#3b82f6" },
        handler: async function (response) {
          await api.post(`/payment/checkout/verify/${id}`, {
            orderId: checkoutData.orderId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          await load();
          setLoadingAction(false);
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function () {
        await load();
        setLoadingAction(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      await load();
      setLoadingAction(false);
    }
  };

  const downloadReport = async (type) => {
    try {
      const response = await api.get(`/payment/export/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = type === "csv" ? "payments-report.csv" : "payments-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  useEffect(() => {
    load();
    const reload = () => load();
    socket.on("sale.created", reload);
    socket.on("payment.updated", reload);
    return () => {
      socket.off("sale.created", reload);
      socket.off("payment.updated", reload);
    };
  }, []);

  const counts = useMemo(() => {
    const pending = payments.filter((p) => p.status === "pending").length;
    const paid = payments.filter((p) => p.status === "paid").length;
    const failed = payments.filter((p) => p.status === "failed").length;
    const totalPayout = payments.reduce(
      (sum, p) => (p.status === "paid" ? sum + (p.commission || 0) : sum),
      0
    );
    return { pending, paid, failed, totalPayout };
  }, [payments]);

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

  const topInfluencerChart = {
    labels: (overview?.topInfluencers || []).map((x) => x.name),
    datasets: [{ 
      label: "Revenue (Rs)", 
      data: (overview?.topInfluencers || []).map((x) => x.revenue), 
      backgroundColor: "#3b82f6",
      borderRadius: 8
    }]
  };

  const salesOverTimeChart = {
    labels: (overview?.salesOverTime || []).map((x) => x.day),
    datasets: [{ 
      label: "Sales", 
      data: (overview?.salesOverTime || []).map((x) => x.value), 
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)", 
      fill: true,
      tension: 0.4
    }]
  };

  const predictionChart7 = {
    labels: prediction7.map((x) => `Day ${x.dayOffset}`),
    datasets: [{ 
      label: "7-day Forecast (Rs)", 
      data: prediction7.map((x) => x.predictedRevenue), 
      borderColor: "#10b981", 
      backgroundColor: "rgba(16, 185, 129, 0.1)", 
      fill: true,
      tension: 0.4
    }]
  };

  const predictionChart30 = {
    labels: prediction30.map((x) => `Day ${x.dayOffset}`),
    datasets: [{ 
      label: "30-day Forecast (Rs)", 
      data: prediction30.map((x) => x.predictedRevenue), 
      borderColor: "#8b5cf6", 
      backgroundColor: "rgba(139, 92, 246, 0.1)", 
      fill: true,
      tension: 0.4
    }]
  };

  const splitChart = {
    labels: (overview?.topInfluencers || []).map((x) => x.name),
    datasets: [
      {
        data: (overview?.topInfluencers || []).map((x) => x.revenue),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"],
        borderWidth: 0
      }
    ]
  };

  if (!overview) {
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
          <h1 style={styles.title}>Finance Dashboard</h1>
          <p style={styles.subtitle}>Payment management & financial analytics</p>
        </div>

        {/* Summary Cards */}
        <div style={styles.summaryGrid}>
          <div style={{...styles.card, ...styles.cardEmerald}}>
            <div style={styles.cardContent}>
              <div style={styles.cardValue}>💰 Rs {counts.totalPayout.toFixed(2)}</div>
              <div style={styles.cardLabel}>Total Payout Amount</div>
            </div>
          </div>

          <div style={{...styles.card, ...styles.cardYellow}}>
            <div style={styles.cardContent}>
              <div style={styles.cardValue}>{counts.pending}</div>
              <div style={styles.cardLabel}>🟡 Pending Payments</div>
            </div>
          </div>

          <div style={{...styles.card, ...styles.cardGreen}}>
            <div style={styles.cardContent}>
              <div style={styles.cardValue}>{counts.paid}</div>
              <div style={styles.cardLabel}>🟢 Completed (Paid)</div>
            </div>
          </div>

          <div style={{...styles.card, ...styles.cardRed}}>
            <div style={styles.cardContent}>
              <div style={styles.cardValue}>{counts.failed}</div>
              <div style={styles.cardLabel}>🔴 Failed Payments</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📊 Top Influencers</h3>
            <div style={styles.chartBox}>
              <Bar data={topInfluencerChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📈 Sales Over Time</h3>
            <div style={styles.chartBox}>
              <Line data={salesOverTimeChart} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>🔮 7-Day Forecast</h3>
            <div style={styles.chartBox}>
              <Line data={predictionChart7} options={chartOptions} />
            </div>
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>📅 30-Day Forecast</h3>
            <div style={styles.chartBox}>
              <Line data={predictionChart30} options={chartOptions} />
            </div>
          </div>

          <div style={{...styles.chartCard, ...styles.chartCardFull}}>
            <h3 style={styles.chartTitle}>🥧 Revenue Split</h3>
            <div style={styles.pieBox}>
              <Pie data={splitChart} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.chartTitle}>💰 Payments & Tracking</h3>
            <div style={styles.buttonGroup}>
              <button onClick={() => downloadReport("csv")} style={styles.btnCsv}>
                📄 Export CSV
              </button>
              <button onClick={() => downloadReport("pdf")} style={styles.btnPdf}>
                📑 Export PDF
              </button>
              <button onClick={load} disabled={loadingAction} style={styles.btnRefresh}>
                🔄 Refresh
              </button>
            </div>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Influencer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Approved Date</th>
                  <th style={styles.th}>Paid Date</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p._id} style={styles.tableRow}>
                    <td style={styles.td}>{p.influencerId}</td>
                    <td style={styles.td}>Rs {p.commission}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(p.status === "paid" ? styles.statusPaid :
                           p.status === "pending" ? styles.statusPending :
                           styles.statusFailed)
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={styles.td}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                    </td>
                    <td style={styles.td}>
                      {p.gatewayMeta?.payoutMode || p.gatewayMeta?.channel || "Razorpay"}
                    </td>
                    <td style={styles.td}>
                      {p.status === "pending" ? (
                        <button 
                          onClick={() => paymentNow(p._id)} 
                          disabled={loadingAction} 
                          style={styles.btnPay}
                        >
                          💳 Pay
                        </button>
                      ) : p.status === "failed" ? (
                        <button 
                          onClick={() => paymentNow(p._id)} 
                          disabled={loadingAction} 
                          style={styles.btnRetry}
                        >
                          🔁 Retry
                        </button>
                      ) : p.status === "paid" ? (
                        <button disabled style={styles.btnPaid}>
                          ✓ Paid
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {payments.length > 10 && (
            <div style={styles.tableFooter}>
              Showing 10 of {payments.length} payments
            </div>
          )}
        </div>
      </div>
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "28px"
  },
  card: {
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease, boxShadow 0.3s ease",
    cursor: "pointer"
  },
  cardEmerald: {
    background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    border: "1px solid #a7f3d0"
  },
  cardYellow: {
    background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
    border: "1px solid #fde68a"
  },
  cardGreen: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    border: "1px solid #bbf7d0"
  },
  cardRed: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    border: "1px solid #fecaca"
  },
  cardContent: {
    textAlign: "center"
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px"
  },
  cardLabel: {
    fontSize: "13px"
  },
  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginBottom: "28px"
  },
  chartCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)"
  },
  chartCardFull: {
    gridColumn: "span 2"
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
    height: "320px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  tableCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)"
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px"
  },
  btnCsv: {
    padding: "8px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  btnPdf: {
    padding: "8px 16px",
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  btnRefresh: {
    padding: "8px 16px",
    background: "#475569",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  tableHeaderRow: {
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
  },
  th: {
    padding: "14px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569"
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s ease"
  },
  td: {
    padding: "14px",
    fontSize: "13px",
    color: "#475569"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },
  statusPaid: {
    background: "#d1fae5",
    color: "#065f46"
  },
  statusPending: {
    background: "#fed7aa",
    color: "#92400e"
  },
  statusFailed: {
    background: "#fee2e2",
    color: "#991b1b"
  },
  btnPay: {
    padding: "6px 14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  btnRetry: {
    padding: "6px 14px",
    background: "#ea580c",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  btnPaid: {
    padding: "6px 14px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    opacity: 0.6,
    cursor: "not-allowed"
  },
  tableFooter: {
    marginTop: "16px",
    textAlign: "center",
    fontSize: "13px",
    color: "#64748b",
    paddingTop: "12px",
    borderTop: "1px solid #e2e8f0"
  }
};

// Add animation to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .finance-card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
    }
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    tr:hover {
      background: #f8fafc;
    }
  `;
  document.head.appendChild(styleSheet);
}
