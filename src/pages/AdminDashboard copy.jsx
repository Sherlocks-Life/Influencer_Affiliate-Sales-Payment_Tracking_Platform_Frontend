import { useEffect, useState } from "react";
import { socket } from "../socket";
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
  Tooltip
} from "chart.js";
import { api } from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

export function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [prediction7, setPrediction7] = useState([]);
  const [prediction30, setPrediction30] = useState([]);
  const [fraud, setFraud] = useState([]);
  const [fraudSummary, setFraudSummary] = useState([]);
  const [fraudTrends, setFraudTrends] = useState([]);
  const [payments, setPayments] = useState([]);

  const load = async () => {
    const [a, b, c, c30, d, d2, e] = await Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/ai-insights"),
      api.get("/analytics/sales-prediction"),
      api.get("/analytics/sales-prediction?days=30"),
      api.get("/analytics/fraud-detection"),
      api.get("/analytics/fraud-trends"),
      api.get("/payment/history")
    ]);
    setOverview(a.data);
    setInsights(b.data.insights || []);
    setPrediction7(c.data.prediction || []);
    setPrediction30(c30.data.prediction || []);
    setFraud(d.data.findings || []);
    setFraudSummary(d.data.aiSummary || []);
    setFraudTrends(d2.data.trends || []);
    setPayments(e.data || []);
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
          razorpay_signature: "mock_signature"
        });
        await load();
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
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        load();
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      await load();
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

  if (!overview) return <p>Loading dashboard...</p>;

  const topInfluencerChart = {
    labels: (overview.topInfluencers || []).map((x) => x.name),
    datasets: [{ label: "Revenue", data: (overview.topInfluencers || []).map((x) => x.revenue), backgroundColor: "#3b82f6" }]
  };
  const salesOverTimeChart = {
    labels: (overview.salesOverTime || []).map((x) => x.day),
    datasets: [{ label: "Sales", data: (overview.salesOverTime || []).map((x) => x.value), borderColor: "#111827" }]
  };
  const predictionChart7 = {
    labels: prediction7.map((x) => `+${x.dayOffset}`),
    datasets: [{ label: "7-day Forecast", data: prediction7.map((x) => x.predictedRevenue), borderColor: "#10b981" }]
  };
  const predictionChart30 = {
    labels: prediction30.map((x) => `+${x.dayOffset}`),
    datasets: [{ label: "30-day Forecast", data: prediction30.map((x) => x.predictedRevenue), borderColor: "#8b5cf6" }]
  };
  const splitChart = {
    labels: (overview.topInfluencers || []).map((x) => x.name),
    datasets: [
      {
        data: (overview.topInfluencers || []).map((x) => x.revenue),
        backgroundColor: ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"]
      }
    ]
  };

  // Fraud Charts
  const fraudBarChart = {
    labels: fraud.map((f) => f.name),
    datasets: [
      { label: "Clicks", data: fraud.map((f) => f.clicks), backgroundColor: "#ef4444" },
      { label: "Sales", data: fraud.map((f) => f.sales), backgroundColor: "#10b981" }
    ]
  };

  const riskCounts = { high: 0, medium: 0, low: 0 };
  fraud.forEach((f) => { riskCounts[f.risk] = (riskCounts[f.risk] || 0) + 1; });
  const riskChart = {
    labels: ["High Risk", "Medium Risk", "Low Risk"],
    datasets: [
      {
        data: [riskCounts.high, riskCounts.medium, riskCounts.low],
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"]
      }
    ]
  };

  const fraudTrendChart = {
    labels: fraudTrends.map((t) => t.day),
    datasets: [
      { label: "Clicks", data: fraudTrends.map((t) => t.clicks), borderColor: "#ef4444", tension: 0.3 },
      { label: "Sales", data: fraudTrends.map((t) => t.sales), borderColor: "#10b981", tension: 0.3 },
      { label: "Unique IPs", data: fraudTrends.map((t) => t.uniqueIps), borderColor: "#3b82f6", tension: 0.3 }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
      <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="text-2xl font-bold text-blue-700">Rs {overview.totalRevenue.toFixed(2)}</div>
        <div className="text-sm text-blue-600">Revenue</div>
      </div>
      <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="text-2xl font-bold text-green-700">{overview.totalSales}</div>
        <div className="text-sm text-green-600">Sales</div>
      </div>
      <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="text-2xl font-bold text-purple-700">{overview.totalClicks}</div>
        <div className="text-sm text-purple-600">Clicks</div>
      </div>
      <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <div className="text-2xl font-bold text-orange-700">{overview.conversionRate}%</div>
        <div className="text-sm text-orange-600">Conversion</div>
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Top Influencers</h3>
        <Bar data={topInfluencerChart} />
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Sales Over Time</h3>
        <Line data={salesOverTimeChart} />
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Sales Prediction (next 7 days)</h3>
        <Line data={predictionChart7} />
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Sales Prediction (next 30 days)</h3>
        <Line data={predictionChart30} />
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Revenue Split</h3>
        <Pie data={splitChart} />
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">AI Insights</h3>
        <ul className="space-y-2">
          {insights.map((x) => (
            <li key={x} className="text-slate-700">• {x}</li>
          ))}
        </ul>
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Fraud Detection — Flagged Influencers</h3>
        {fraud.length === 0 ? (
          <p className="text-slate-600">No high-risk anomalies detected.</p>
        ) : (
          <Bar data={fraudBarChart} />
        )}
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Fraud Risk Distribution</h3>
        {fraud.length === 0 ? (
          <p className="text-slate-600">No risks to display.</p>
        ) : (
          <Doughnut data={riskChart} />
        )}
      </div>

      <div className="card glass-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-3">Fraud Trends Over Time</h3>
        {fraudTrends.length === 0 ? (
          <p className="text-slate-600">No trend data.</p>
        ) : (
          <Line data={fraudTrendChart} />
        )}
      </div>

      <div className="card glass-card lg:col-span-4">
        <h3 className="text-lg font-semibold mb-3">Fraud Detection Alerts</h3>
        <ul className="space-y-2 mb-4">
          {fraudSummary.map((x) => (
            <li key={x} className="text-slate-700">• {x}</li>
          ))}
        </ul>
        {fraud.length === 0 ? (
          <p className="text-slate-600">No high-risk anomalies detected.</p>
        ) : (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            {fraud.map((f) => (
              <div key={f.influencerId} className={`p-3 rounded-lg ${f.risk === "high" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                <p className={f.risk === "high" ? "text-red-600 font-semibold" : "text-amber-600 font-semibold"}>
                  <strong>{f.name}</strong> — {f.reason}
                </p>
                <small className="text-slate-600">({f.clicks} clicks, {f.sales} sales, {f.conversionRate}% CVR, Risk: {f.risk})</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="card glass-card lg:col-span-4">
        <h3 className="text-lg font-semibold mb-3">Admin Summary</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="card bg-slate-50">
            <div className="text-lg font-semibold text-slate-700">👥 {overview?.totalInfluencers ?? "—"}</div>
            <div className="text-xs text-slate-600">Total Influencers</div>
          </div>
          <div className="card bg-slate-50">
            <div className="text-lg font-semibold text-slate-700">💰 Rs {overview?.totalRevenue ? overview.totalRevenue.toFixed(0) : "—"}</div>
            <div className="text-xs text-slate-600">Total Revenue</div>
          </div>
          <div className="card bg-yellow-50">
            <div className="text-lg font-semibold text-yellow-700">🟡 {payments.filter((p) => p.status === "pending").length}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="card bg-green-50">
            <div className="text-lg font-semibold text-green-700">🟢 {payments.filter((p) => p.status === "paid").length}</div>
            <div className="text-xs text-green-600">Paid</div>
          </div>
          <div className="card bg-red-50">
            <div className="text-lg font-semibold text-red-700">🔴 {payments.filter((p) => p.status === "failed").length}</div>
            <div className="text-xs text-red-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Payments Overview */}
      <div className="card glass-card lg:col-span-4">
        <h3 className="text-lg font-semibold mb-3">Payments Overview</h3>
        <div className="actions mb-4">
          <button onClick={() => downloadReport("csv")} className="bg-blue-600 hover:bg-blue-700">Export CSV</button>
          <button onClick={() => downloadReport("pdf")} className="bg-green-600 hover:bg-green-700">Export PDF</button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr className="text-left text-sm font-semibold text-slate-700">
                <th className="p-4 min-w-[220px]">Influencer</th>
                <th className="p-4 min-w-[140px]">Commission</th>
                <th className="p-4 min-w-[120px]">Status</th>
                <th className="p-4 min-w-[180px]">Payment Date</th>
                <th className="p-4 min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.slice(0, 10).map((p) => (
                <tr key={p._id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-4 break-word text-slate-700">{p.influencerId}</td>
                  <td className="p-4 text-slate-700">Rs {p.commission}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      p.status === "paid" ? "bg-green-100 text-green-800" :
                      p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      p.status === "failed" ? "bg-red-100 text-red-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 text-sm">
                    {p.paidAt ? new Date(p.paidAt).toLocaleString() : p.failedAt ? new Date(p.failedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-4">
                    {p.status === "pending" ? (
                      <button onClick={() => paymentNow(p._id)} className="bg-blue-600 hover:bg-blue-700 text-sm">Pay Now</button>
                    ) : p.status === "failed" ? (
                      <button onClick={() => paymentNow(p._id)} className="bg-orange-600 hover:bg-orange-700 text-sm">Retry</button>
                    ) : p.status === "paid" ? (
                      <button disabled className="opacity-50 cursor-not-allowed bg-slate-600 text-sm">
                        ✅ Paid
                      </button>
                    ) : (
                      <button disabled className="opacity-50 cursor-not-allowed bg-slate-600 text-sm">
                        —
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

