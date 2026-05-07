import { useEffect, useState } from "react";

import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
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
  Filler,
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



export function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [prediction7, setPrediction7] = useState([]);
  const [prediction30, setPrediction30] = useState([]);
  const [fraud, setFraud] = useState([]);
  const [fraudSummary, setFraudSummary] = useState([]);
  const [fraudTrends, setFraudTrends] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [a, b, c, c30, d, d2, e] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/ai-insights"),
        api.get("/analytics/sales-prediction"),
        api.get("/analytics/sales-prediction?days=30"),
        api.get("/analytics/fraud-detection"),
        api.get("/analytics/fraud-trends"),
        api.get("/payment/history"),
      ]);
      setOverview(a.data);
      setInsights(b.data.insights || []);
      setPrediction7(c.data.prediction || []);
      setPrediction30(c30.data.prediction || []);
      setFraud(d.data.findings || []);
      setFraudSummary(d.data.aiSummary || []);
      setFraudTrends(d2.data.trends || []);
      setPayments(e.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const paymentNow = async (id) => {
    setProcessingPaymentId(id);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) throw new Error("Failed to load Razorpay SDK");

      const { data: checkoutData } = await api.post(`/payment/checkout/create/${id}`);

      const keyId = checkoutData?.keyId;
      const useMock = !keyId || !String(keyId).startsWith("rzp_");

      if (useMock) {
        await api.post(`/payment/checkout/verify/${id}`, {
          orderId: checkoutData.orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
        });
        await load();
        setProcessingPaymentId(null);
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
            razorpay_signature: response.razorpay_signature,
          });
          await load();
          setProcessingPaymentId(null);
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        load();
        setProcessingPaymentId(null);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      await load();
      setProcessingPaymentId(null);
    }
  };

  const downloadReport = async (type) => {
    const response = await api.get(`/payment/export/${type}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "csv" ? "payments-report.csv" : "payments-report.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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

  if (isLoading && !overview)
    return (
      <div className="loading-container">
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );

  if (!overview) return null;

  const topInfluencerChart = {
    labels: (overview.topInfluencers || []).map((x) => x.name),
    datasets: [
      {
        label: "Revenue (Rs)",
        data: (overview.topInfluencers || []).map((x) => x.revenue),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const salesOverTimeChart = {
    labels: (overview.salesOverTime || []).map((x) => x.day),
    datasets: [
      {
        label: "Sales",
        data: (overview.salesOverTime || []).map((x) => x.value),
        borderColor: "#1e293b",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
          gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const predictionChart7 = {
    labels: prediction7.map((x) => `Day ${x.dayOffset}`),
    datasets: [
      {
        label: "7-day Forecast (Rs)",
        data: prediction7.map((x) => x.predictedRevenue),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const predictionChart30 = {
    labels: prediction30.map((x) => `Day ${x.dayOffset}`),
    datasets: [
      {
        label: "30-day Forecast (Rs)",
        data: prediction30.map((x) => x.predictedRevenue),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 2,
      },
    ],
  };

  const splitChart = {
    labels: (overview.topInfluencers || []).map((x) => x.name),
    datasets: [
      {
        data: (overview.topInfluencers || []).map((x) => x.revenue),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const fraudBarChart = {
    labels: fraud.map((f) => f.name),
    datasets: [
      {
        label: "Clicks",
        data: fraud.map((f) => f.clicks),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderRadius: 8,
      },
      {
        label: "Sales",
        data: fraud.map((f) => f.sales),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderRadius: 8,
      },
    ],
  };

  const riskCounts = { high: 0, medium: 0, low: 0 };
  fraud.forEach((f) => {
    riskCounts[f.risk] = (riskCounts[f.risk] || 0) + 1;
  });
  const riskChart = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [riskCounts.high, riskCounts.medium, riskCounts.low],
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const fraudTrendChart = {
    labels: fraudTrends.map((t) => t.day),
    datasets: [
      {
        label: "Clicks",
        data: fraudTrends.map((t) => t.clicks),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#ef4444",
      },
      {
        label: "Sales",
        data: fraudTrends.map((t) => t.sales),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
      },
      {
        label: "Unique IPs",
        data: fraudTrends.map((t) => t.uniqueIps),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6",
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Real-time analytics, fraud detection & payment management</p>
        </div>

        {/* KPI Cards Grid */}
        <div className="kpi-grid">
          <div className="kpi-card kpi-card-blue">
            <div className="kpi-card-content">
              <div className="kpi-header">
                <span className="kpi-label kpi-label-blue">Revenue</span>
                <div className="kpi-icon kpi-icon-blue">
                  <svg className="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="kpi-value">Rs {overview.totalRevenue.toFixed(2)}</div>
              <div className="kpi-description">Total revenue generated</div>
            </div>
          </div>

          <div className="kpi-card kpi-card-green">
            <div className="kpi-card-content">
              <div className="kpi-header">
                <span className="kpi-label kpi-label-green">Sales</span>
                <div className="kpi-icon kpi-icon-green">
                  <svg className="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="kpi-value">{overview.totalSales}</div>
              <div className="kpi-description">Total completed sales</div>
            </div>
          </div>

          <div className="kpi-card kpi-card-purple">
            <div className="kpi-card-content">
              <div className="kpi-header">
                <span className="kpi-label kpi-label-purple">Clicks</span>
                <div className="kpi-icon kpi-icon-purple">
                  <svg className="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
              <div className="kpi-value">{overview.totalClicks}</div>
              <div className="kpi-description">Total affiliate clicks</div>
            </div>
          </div>

          <div className="kpi-card kpi-card-orange">
            <div className="kpi-card-content">
              <div className="kpi-header">
                <span className="kpi-label kpi-label-orange">Conversion</span>
                <div className="kpi-icon kpi-icon-orange">
                  <svg className="kpi-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="kpi-value">{overview.conversionRate}%</div>
              <div className="kpi-description">Click to sale conversion</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-blue"></span>
              Top Influencers
            </h3>
            <div className="chart-container">
              <Bar data={topInfluencerChart} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-blue"></span>
              Sales Over Time
            </h3>
            <div className="chart-container">
              <Line data={salesOverTimeChart} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-emerald"></span>
              Sales Prediction (7 days)
            </h3>
            <div className="chart-container">
              <Line data={predictionChart7} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-violet"></span>
              Sales Prediction (30 days)
            </h3>
            <div className="chart-container">
              <Line data={predictionChart30} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-pink"></span>
              Revenue Split
            </h3>
            <div className="chart-container-center">
              <div className="pie-chart-wrapper">
                <Pie data={splitChart} options={{ maintainAspectRatio: false, responsive: true }} />
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">
              <span className="chart-title-bar chart-title-bar-indigo"></span>
              AI Insights
            </h3>
            <div className="insights-container">
              {insights.map((x, idx) => (
                <div key={idx} className="insight-item">
                  <div className="insight-dot"></div>
                  <p className="insight-text">{x}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fraud Detection Section */}
        <div className="fraud-section">
          <h2 className="fraud-title">
            <svg className="fraud-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Fraud Detection & Analytics
          </h2>
          
          <div className="fraud-grid">
            <div className="fraud-card">
              <h3 className="fraud-card-title">Flagged Influencers</h3>
              {fraud.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">✓ No high-risk anomalies detected</p>
                </div>
              ) : (
                <div className="fraud-chart-container">
                  <Bar data={fraudBarChart} options={{ maintainAspectRatio: false, responsive: true }} />
                </div>
              )}
            </div>

            <div className="fraud-card">
              <h3 className="fraud-card-title">Risk Distribution</h3>
              {fraud.length === 0 ? (
                <div className="empty-state-light">
                  <p className="empty-state-text-light">No risk data available</p>
                </div>
              ) : (
                <div className="fraud-chart-container-center">
                  <div className="risk-chart-wrapper">
                    <Doughnut data={riskChart} options={{ maintainAspectRatio: false, responsive: true }} />
                  </div>
                </div>
              )}
            </div>

            <div className="fraud-card-full">
              <h3 className="fraud-card-title">Fraud Trends Over Time</h3>
              {fraudTrends.length === 0 ? (
                <div className="empty-state-light">
                  <p className="empty-state-text-light">No trend data available</p>
                </div>
              ) : (
                <div className="fraud-trend-chart">
                  <Line data={fraudTrendChart} options={{ maintainAspectRatio: false, responsive: true }} />
                </div>
              )}
            </div>

            <div className="fraud-card-full">
              <h3 className="fraud-card-title">Fraud Detection Alerts</h3>
              <div className="alerts-container">
                {fraudSummary.map((x, idx) => (
                  <div key={idx} className="alert-item">
                    <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="alert-text">{x}</p>
                  </div>
                ))}
              </div>
              {fraud.length > 0 && (
                <div className="findings-container">
                  <h4 className="findings-title">Detailed Findings</h4>
                  {fraud.map((f) => (
                    <div key={f.influencerId} className={`finding-item ${f.risk === "high" ? "finding-high" : "finding-medium"}`}>
                      <p className={`finding-name ${f.risk === "high" ? "finding-name-high" : "finding-name-medium"}`}>
                        <strong>{f.name}</strong> — {f.reason}
                      </p>
                      <div className="finding-stats">
                        <span>🖱️ {f.clicks} clicks</span>
                        <span>💰 {f.sales} sales</span>
                        <span>📊 {f.conversionRate}% CVR</span>
                        <span className={`finding-risk ${f.risk === "high" ? "finding-risk-high" : "finding-risk-medium"}`}>
                          ⚠️ Risk: {f.risk}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-section">
          <div className="summary-card">
            <h3 className="summary-title">Admin Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-value">👥 {overview?.totalInfluencers ?? "—"}</div>
                <div className="summary-label">Total Influencers</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">💰 Rs {overview?.totalRevenue ? overview.totalRevenue.toFixed(0) : "—"}</div>
                <div className="summary-label">Total Revenue</div>
              </div>
              <div className="summary-item summary-item-yellow">
                <div className="summary-value summary-value-yellow">🟡 {payments.filter((p) => p.status === "pending").length}</div>
                <div className="summary-label summary-label-yellow">Pending</div>
              </div>
              <div className="summary-item summary-item-green">
                <div className="summary-value summary-value-green">🟢 {payments.filter((p) => p.status === "paid").length}</div>
                <div className="summary-label summary-label-green">Paid</div>
              </div>
              <div className="summary-item summary-item-red">
                <div className="summary-value summary-value-red">🔴 {payments.filter((p) => p.status === "failed").length}</div>
                <div className="summary-label summary-label-red">Failed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Overview */}
        <div className="payments-section">
          <div className="payments-header">
            <h3 className="payments-title">Payments Overview</h3>
            <div className="payments-actions">
              <button onClick={() => downloadReport("csv")} className="btn-csv">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button onClick={() => downloadReport("pdf")} className="btn-pdf">
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>

          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr className="payments-table-header">
                  <th className="payments-table-cell">Influencer</th>
                  <th className="payments-table-cell">Commission</th>
                  <th className="payments-table-cell">Status</th>
                  <th className="payments-table-cell">Payment Date</th>
                  <th className="payments-table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p._id} className="payments-table-row">
                    <td className="payments-table-data payments-table-data-name">{p.influencerId}</td>
                    <td className="payments-table-data">Rs {p.commission}</td>
                    <td className="payments-table-data">
                      <span className={`status-badge status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="payments-table-data payments-table-data-date">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : p.failedAt ? new Date(p.failedAt).toLocaleString() : "—"}
                    </td>
                    <td className="payments-table-data">
                      {p.status === "pending" ? (
                        <button
                          onClick={() => paymentNow(p._id)}
                          disabled={processingPaymentId === p._id}
                          className="pay-btn pay-btn-primary"
                        >
                          {processingPaymentId === p._id ? (
                            <>
                              <div className="spinner-small"></div>
                              Processing
                            </>
                          ) : (
                            "Pay Now"
                          )}
                        </button>
                      ) : p.status === "failed" ? (
                        <button
                          onClick={() => paymentNow(p._id)}
                          disabled={processingPaymentId === p._id}
                          className="pay-btn pay-btn-warning"
                        >
                          {processingPaymentId === p._id ? (
                            <>
                              <div className="spinner-small"></div>
                              Retrying
                            </>
                          ) : (
                            "Retry"
                          )}
                        </button>
                      ) : p.status === "paid" ? (
                        <span className="paid-status">
                          <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Paid
                        </span>
                      ) : (
                        <span className="empty-status">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length > 10 && (
            <div className="payments-footer">
              Showing 10 of {payments.length} payments
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Loading Styles */
        .loading-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .loading-spinner {
          width: 4rem;
          height: 4rem;
          border: 4px solid #3b82f6;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #475569;
          font-weight: 500;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Dashboard Container */
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 1rem;
        }

        @media (min-width: 768px) {
          .dashboard-container {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .dashboard-container {
            padding: 2rem;
          }
        }

        .dashboard-wrapper {
          max-width: 1600px;
          margin: 0 auto;
        }

        /* Header Styles */
        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 1.875rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
        }

        @media (min-width: 768px) {
          .dashboard-title {
            font-size: 2.25rem;
          }
        }

        .dashboard-subtitle {
          color: #64748b;
          margin-top: 0.5rem;
        }

        /* KPI Card Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .kpi-card {
          position: relative;
          overflow: hidden;
          border-radius: 1rem;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .kpi-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }

        .kpi-card-blue::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
        }

        .kpi-card-green::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
        }

        .kpi-card-purple::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
        }

        .kpi-card-orange::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
        }

        .kpi-card-content {
          position: relative;
          padding: 1.5rem;
        }

        .kpi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .kpi-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-label-blue { color: #3b82f6; }
        .kpi-label-green { color: #10b981; }
        .kpi-label-purple { color: #8b5cf6; }
        .kpi-label-orange { color: #f59e0b; }

        .kpi-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kpi-icon-blue { background: rgba(59, 130, 246, 0.1); }
        .kpi-icon-green { background: rgba(16, 185, 129, 0.1); }
        .kpi-icon-purple { background: rgba(139, 92, 246, 0.1); }
        .kpi-icon-orange { background: rgba(245, 158, 11, 0.1); }

        .kpi-svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .kpi-icon-blue .kpi-svg { color: #2563eb; }
        .kpi-icon-green .kpi-svg { color: #059669; }
        .kpi-icon-purple .kpi-svg { color: #7c3aed; }
        .kpi-icon-orange .kpi-svg { color: #ea580c; }

        .kpi-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1e293b;
        }

        .kpi-description {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 1024px) {
          .charts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .chart-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: box-shadow 0.3s ease;
        }

        .chart-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
        }

        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .chart-title-bar {
          width: 0.25rem;
          height: 1.5rem;
          border-radius: 9999px;
        }

        .chart-title-bar-blue { background: #3b82f6; }
        .chart-title-bar-emerald { background: #10b981; }
        .chart-title-bar-violet { background: #8b5cf6; }
        .chart-title-bar-pink { background: #ec4899; }
        .chart-title-bar-indigo { background: #6366f1; }

        .chart-container {
          height: 20rem;
        }

        .chart-container-center {
          height: 20rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pie-chart-wrapper {
          width: 16rem;
          height: 16rem;
        }

        /* Insights */
        .insights-container {
          max-height: 20rem;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .insights-container::-webkit-scrollbar {
          width: 6px;
        }

        .insights-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .insights-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        .insights-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .insight-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          margin-bottom: 0.75rem;
          transition: background 0.3s ease;
        }

        .insight-item:hover {
          background: #f1f5f9;
        }

        .insight-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #6366f1;
          border-radius: 9999px;
          margin-top: 0.375rem;
        }

        .insight-text {
          color: #334155;
          font-size: 0.875rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Fraud Section */
        .fraud-section {
          margin-bottom: 2rem;
        }

        .fraud-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .fraud-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #ef4444;
        }

        .fraud-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .fraud-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .fraud-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .fraud-card-full {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          grid-column: 1 / -1;
        }

        .fraud-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .fraud-chart-container {
          height: 20rem;
        }

        .fraud-chart-container-center {
          height: 20rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .risk-chart-wrapper {
          width: 16rem;
          height: 16rem;
        }

        .fraud-trend-chart {
          height: 20rem;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 16rem;
          background: #f0fdf4;
          border-radius: 0.75rem;
        }

        .empty-state-text {
          color: #166534;
          font-weight: 500;
        }

        .empty-state-light {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 16rem;
          background: #f8fafc;
          border-radius: 0.75rem;
        }

        .empty-state-text-light {
          color: #64748b;
          font-weight: 500;
        }

        .alerts-container {
          margin-bottom: 1.5rem;
        }

        .alert-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .alert-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #d97706;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .alert-text {
          color: #92400e;
          font-size: 0.875rem;
          margin: 0;
        }

        .findings-container {
          margin-top: 1.5rem;
        }

        .findings-title {
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.75rem;
        }

        .finding-item {
          padding: 1rem;
          border-radius: 0.75rem;
          margin-bottom: 0.75rem;
          transition: all 0.3s ease;
        }

        .finding-item:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .finding-high {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .finding-medium {
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .finding-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .finding-name-high { color: #991b1b; }
        .finding-name-medium { color: #92400e; }

        .finding-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.875rem;
          color: #475569;
        }

        .finding-risk {
          font-weight: 500;
        }

        .finding-risk-high { color: #dc2626; }
        .finding-risk-medium { color: #d97706; }

        /* Summary Section */
        .summary-section {
          margin-bottom: 2rem;
        }

        .summary-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .summary-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1.25rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .summary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .summary-item {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 0.75rem;
          padding: 1rem;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .summary-item:hover {
          transform: scale(1.05);
        }

        .summary-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #334155;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .summary-item-yellow {
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
        }

        .summary-value-yellow { color: #92400e; }
        .summary-label-yellow { color: #b45309; }

        .summary-item-green {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .summary-value-green { color: #166534; }
        .summary-label-green { color: #15803d; }

        .summary-item-red {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }

        .summary-value-red { color: #991b1b; }
        .summary-label-red { color: #b91c1c; }

        /* Payments Section */
        .payments-section {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .payments-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 640px) {
          .payments-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .payments-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }

        .payments-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-csv, .btn-pdf {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-csv {
          background: #2563eb;
          color: white;
        }

        .btn-csv:hover {
          background: #1d4ed8;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn-pdf {
          background: #059669;
          color: white;
        }

        .btn-pdf:hover {
          background: #047857;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 1rem;
          height: 1rem;
        }

        .payments-table-container {
          overflow-x: auto;
        }

        .payments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .payments-table-header {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .payments-table-cell {
          padding: 1rem;
          text-align: left;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        .payments-table-row {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.3s ease;
        }

        .payments-table-row:hover {
          background: #f8fafc;
        }

        .payments-table-data {
          padding: 1rem;
          color: #475569;
        }

        .payments-table-data-name {
          font-weight: 500;
        }

        .payments-table-data-date {
          font-size: 0.875rem;
        }

        .status-badge {
          display: inline-flex;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-paid {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .pay-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pay-btn-primary {
          background: #2563eb;
          color: white;
        }

        .pay-btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .pay-btn-primary:disabled {
          background: #60a5fa;
          cursor: not-allowed;
        }

        .pay-btn-warning {
          background: #ea580c;
          color: white;
        }

        .pay-btn-warning:hover:not(:disabled) {
          background: #c2410c;
        }

        .pay-btn-warning:disabled {
          background: #f97316;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 0.75rem;
          height: 0.75rem;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.5s linear infinite;
        }

        .paid-status {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #059669;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .check-icon {
          width: 1rem;
          height: 1rem;
        }

        .empty-status {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .payments-footer {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
