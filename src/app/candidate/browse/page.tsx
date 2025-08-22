import { Card } from "../../../components/ui";

export default function Browse(){
  return (
      <section className="col" style={{gap:16}}>
        <h2>Search Results</h2>
        <div className="row" style={{gap:8}}>
          <div className="badge">Industry</div>
          <div className="badge">Firm</div>
          <div className="badge">Experience Level</div>
          <div className="badge">Availability</div>
        </div>
        <Card style={{padding:0}}>
          <table className="table">
            <thead><tr><th>Title</th><th>Experience</th><th>Availability</th><th>Actions</th></tr></thead>
            <tbody>
              <tr><td>Senior Consultant at Global Consulting Firm</td><td>5+ years</td><td>Weekdays</td><td><a href="/candidate/detail/1">View Profile</a></td></tr>
              <tr><td>Finance Manager at Tech Innovators Inc.</td><td>8+ years</td><td>Weekends</td><td><a href="/candidate/detail/1">View Profile</a></td></tr>
              <tr><td>Independent Strategy Advisor</td><td>10+ years</td><td>Evenings</td><td><a href="/candidate/detail/1">View Profile</a></td></tr>
              <tr><td>Principal at Investment Group</td><td>7+ years</td><td>Flexible</td><td><a href="/candidate/detail/1">View Profile</a></td></tr>
              <tr><td>Consulting Partner at Top Tier Firm</td><td>12+ years</td><td>Weekdays</td><td><a href="/candidate/detail/1">View Profile</a></td></tr>
            </tbody>
          </table>
        </Card>
      </section>
  )
}
