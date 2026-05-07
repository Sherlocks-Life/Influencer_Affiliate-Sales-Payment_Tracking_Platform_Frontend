import { useEffect, useState } from "react";
// import { connectSocket } from "../socket";
import { getSocket } from "../socket";
import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import Card from "../components/Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);



export function FinanceDashboard({ session }) {
  const [finances, setFinances] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalPayouts: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const token = session?.token;

    // Connect socket with auth so backend can emit correct role-based data
    // const socket = token ? connectSocket(token) : null;

    // if (!socket) {
    //   setLoading(false);
    //   return;
    // }


    useEffect(() => {
    load();
    const reload = () => load();
    const socket = getSocket();
    socket.on("sale.created", reload);
    socket.on("payment.updated", reload);
    return () => {
      socket.off("sale.created", reload);
      socket.off("payment.updated", reload);
    };
  }, []);
  
    const onFinanceUpdate = (data) => {
      // Expecting backend to send finance data payload.
      // We keep backward compatibility with existing state shape.
      const nextFinances = Array.isArray(data) ? data : (data?.finances ?? []);
      setFinances(nextFinances);

      // If backend also sends stats, prefer it; otherwise compute a best-effort fallback.
      const nextStats =
        data?.stats ??
        {
          totalRevenue: nextFinances.reduce((sum, x) => sum + (Number(x.amount) || 0), 0),
          totalPayouts: nextFinances.reduce((sum, x) => sum + (Number(x.payout) || 0), 0),
          balance: 0,
        };

      setStats(nextStats);
      setLoading(false);
    };

    socket.on("finance-update", onFinanceUpdate);

    // If socket already connected and backend emits immediately, handler above will run.
    // We also avoid blocking UI indefinitely: show loading until first payload.
    return () => {
      socket.off("finance-update", onFinanceUpdate);
    };
  }, [session?.token]);

  if (loading) {
    return <div className="dashboard-loading">Loading finances...</div>;
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>Finance Dashboard</h2>
        <p>Manage transactions and payments</p>
      </div>

      <div className="stats-grid">
        <Card>
          <div className="stat">
            <h3>Total Revenue</h3>
            <p className="stat-value">${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <h3>Total Payouts</h3>
            <p className="stat-value">${stats.totalPayouts.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <h3>Balance</h3>
            <p className="stat-value">${stats.balance.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3>Financial Overview</h3>
        <div className="chart-container" style={{ height: "300px" }}>
          <Bar
            data={{
              labels: finances.map((f) => f.name) || ["Jan", "Feb", "Mar"],
              datasets: [
                {
                  label: "Amount",
                  data: finances.map((f) => f.amount) || [0, 0, 0],
                  backgroundColor: "#8884d8",
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true },
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
}
