import { useEffect, useState } from "react";

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
    const fetchInfluencerData = async () => {
      try {
        // Fetch influencer data from your backend
        setLoading(false);
      } catch (error) {
        console.error("Error fetching influencer data:", error);
        setLoading(false);
      }
    };

    fetchInfluencerData();

    socket.on("influencer-update", (data) => {
      setInfluencers(data);
    });

    return () => {
      socket.off("influencer-update");
    };
  }, []);

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
