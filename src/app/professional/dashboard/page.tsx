import { Card } from "../../../components/ui";
import DashboardClient from "../../../components/DashboardClient";

export default function ProDashboard() {
  const rows = [
    {
      candidate: "Liam Carter",
      date: "2024-03-15",
      time: "10:00 AM",
      action: { label: "Join" },
    },
    {
      candidate: "Olivia Bennett",
      date: "2024-03-16",
      time: "11:30 AM",
      action: { label: "Join" },
    },
    {
      candidate: "Ethan Walker",
      date: "2024-03-17",
      time: "2:00 PM",
      action: { label: "Join" },
    },
  ];

  const columns = [
    { key: "candidate", label: "Candidate" },
    { key: "date", label: "Date" },
    { key: "time", label: "Time" },
    { key: "action", label: "" },
  ];

  return (
    <div className="grid grid-2">
      <DashboardClient
        data={rows}
        columns={columns}
        showFilters={false}
        buttonColumns={["action"]}
      />
      <Card style={{ padding: 16 }}>
        <div className="grid grid-2">
          <div className="card" style={{ padding: 16 }}>
            <h4>Total Earnings</h4>
            <div style={{ fontSize: 24 }}>$2,500</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Response Rate</h4>
            <div style={{ fontSize: 24 }}>85%</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Recent Earnings</h4>
            <div>$250 this month</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <h4>Recent Feedback</h4>
            <p>“Excellent insights and feedback on my case study.”</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
