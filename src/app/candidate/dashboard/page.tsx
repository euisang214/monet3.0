import { CandidateShell } from "../../../components/layouts";
import { Card, Button } from "../../../components/ui";

const upcoming = [
  {name:'Ethan Harper', title:'Senior Consultant at Global Consulting Firm'},
  {name:'Olivia Bennett', title:'Finance Manager at Tech Innovators Inc.'},
  {name:'Noah Carter', title:'Independent Strategy Advisor'},
  {name:'Ava Morgan', title:'Principal at Investment Group'},
  {name:'Liam Foster', title:'Consulting Partner at Top Tier Firm'},
];

const results = [
  {employer:'Global Consulting Firm', title:'Senior Consultant', experience:'5+ years', availability:'Weekdays'},
  {employer:'Tech Innovators Inc.', title:'Finance Manager', experience:'8+ years', availability:'Weekends'},
  {employer:'Independent', title:'Strategy Advisor', experience:'10+ years', availability:'Evenings'},
  {employer:'Investment Group', title:'Principal', experience:'7+ years', availability:'Flexible'},
  {employer:'Top Tier Firm', title:'Consulting Partner', experience:'12+ years', availability:'Weekdays'},
];

export default function CandidateDashboard(){
  return (
    <CandidateShell>
      <aside>
        <Card style={{padding:12}}>
          <h3>Upcoming Calls</h3>
          <div className="col" style={{gap:8}}>
            {upcoming.map(u=>(
              <div key={u.name} className="row" style={{justifyContent:'space-between'}}>
                <div className="col"><strong>{u.name}</strong><span style={{color:'var(--text-muted)'}}>{u.title}</span></div>
                <Button>Join</Button>
              </div>
            ))}
          </div>
        </Card>
      </aside>
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
            <thead>
              <tr><th>Title</th><th>Experience</th><th>Availability</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {results.map((r, i)=>(
                <tr key={i}>
                  <td>{r.title} at {r.employer}</td>
                  <td>{r.experience}</td>
                  <td>{r.availability}</td>
                  <td><a href="/candidate/detail/1">View Profile</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </CandidateShell>
  );
}
