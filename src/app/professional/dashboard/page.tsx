import { Card, Button } from "../../../components/ui";

export default function ProDashboard(){
  return (
      <div className="grid grid-2">
        <Card style={{padding:16}}>
          <h3>Upcoming Calls</h3>
          <table className="table">
            <thead><tr><th>Candidate</th><th>Date</th><th>Time</th><th></th></tr></thead>
            <tbody>
              <tr><td>Liam Carter</td><td>2024-03-15</td><td>10:00 AM</td><td><Button>Join</Button></td></tr>
              <tr><td>Olivia Bennett</td><td>2024-03-16</td><td>11:30 AM</td><td><Button>Join</Button></td></tr>
              <tr><td>Ethan Walker</td><td>2024-03-17</td><td>2:00 PM</td><td><Button>Join</Button></td></tr>
            </tbody>
          </table>
        </Card>
        <Card style={{padding:16}}>
          <div className="grid grid-2">
            <div className="card" style={{padding:16}}>
              <h4>Total Earnings</h4>
              <div style={{fontSize:24}}>$2,500</div>
            </div>
            <div className="card" style={{padding:16}}>
              <h4>Response Rate</h4>
              <div style={{fontSize:24}}>85%</div>
            </div>
            <div className="card" style={{padding:16}}>
              <h4>Recent Earnings</h4>
              <div>$250 this month</div>
            </div>
            <div className="card" style={{padding:16}}>
              <h4>Recent Feedback</h4>
              <p>“Excellent insights and feedback on my case study.”</p>
            </div>
          </div>
        </Card>
      </div>
  )
}
