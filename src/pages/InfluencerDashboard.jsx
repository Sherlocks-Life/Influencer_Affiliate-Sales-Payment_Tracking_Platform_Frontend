import { useEffect, useState } from "react";
import { connectSocket } from "../socket";

import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import Card from "../components/Card";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);


export function InfluencerDashboard({ session }) {
  const [influencers, setInfluencers] = useState([]);
  const [stats, setStats] = useState({ totalFollowers: 0, totalEarnings: 0, activePromotions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = session?.token;

    // Connect socket with auth so backend can emit correct role-based data
    const socket = token ? connectSocket(token) : null;

    if (!socket) {
      setLoading(false);
      return;
    }

    const onInfluencerUpdate = (data) => {
      const nextInfluencers = Array.isArray(data) ? data : (data?.influencers ?? []);

      setInfluencers(nextInfluencers);

      const nextStats =
        data?.stats ??
        {
          totalFollowers: nextInfluencers.reduce((sum, x) => sum + (Number(x.followers) || 0), 0),
          totalEarnings: nextInfluencers.reduce((sum, x) => sum + (Number(x.earnings) || 0), 0),
          activePromotions: 0,
        };

      setStats(nextStats);
      setLoading(false);
    };

    socket.on("influencer-update", onInfluencerUpdate);

    return () => {
      socket.off("influencer-update", onInfluencerUpdate);
    };
  }, [session?.token]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h2>Influencer Dashboard</h2>
        <p>Track your affiliate sales and earnings</p>
      </div>

      <div className="stats-grid">
        <Card>
          <div className="stat">
            <h3>Total Followers</h3>
            <p className="stat-value">{stats.totalFollowers.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <h3>Total Earnings</h3>
            <p className="stat-value">${stats.totalEarnings.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="stat">
            <h3>Active Promotions</h3>
            <p className="stat-value">{stats.activePromotions}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3>Earnings Trend</h3>
        <div className="chart-container" style={{ height: "300px" }}>
          <Line
            data={{
              labels: influencers.map((i) => i.name) || ["Week 1", "Week 2", "Week 3"],
              datasets: [
                {
                  label: "Earnings",
                  data: influencers.map((i) => i.earnings) || [0, 0, 0],
                  borderColor: "#82ca9d",
                  backgroundColor: "rgba(130, 202, 157, 0.1)",
                  tension: 0.4,
                  fill: true,
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
