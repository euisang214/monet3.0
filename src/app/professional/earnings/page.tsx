import { Card } from "../../../components/ui";
import { Card } from "../../../components/ui";

export default function Earnings(){
  return (
      <Card style={{padding:16}}>
        <h2>Earnings</h2>
        <div className="grid grid-3" style={{marginBottom:16}}>
          <div className="card" style={{padding:16}}><h4>Total Earnings</h4><div style={{fontSize:24}}>$12,500</div></div>
          <div className="card" style={{padding:16}}><h4>Current Month</h4><div style={{fontSize:24}}>$2,350</div></div>
          <div className="card" style={{padding:16}}><h4>Pending Payouts</h4><div style={{fontSize:24}}>$500</div></div>
        </div>
        <table className="table">
          <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>July 15, 2024</td><td>Expert Call with Liam Carter</td><td>+$50</td><td>Completed</td></tr>
            <tr><td>July 15, 2024</td><td>Expert Call with Liam Carter</td><td>+$50</td><td>Completed</td></tr>
            <tr><td>July 15, 2024</td><td>Expert Call with Liam Carter</td><td>+$50</td><td>Completed</td></tr>
          </tbody>
        </table>
      </Card>
  )
}
