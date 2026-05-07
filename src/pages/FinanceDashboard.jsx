import { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchFinances = async () => {
      try {
        // Fetch finance data from your backend
        setLoading(false);
      } catch (error) {
        console.error("Error fetching finances:", error);
        setLoading(false);
      }
    };

    fetchFinances();

    const socket = getSocket();
    socket.on("finance-update", (data) => {
      setFinances(data);
    });

    return () => {
      socket.off("finance-update");
    };
  }, []);

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
