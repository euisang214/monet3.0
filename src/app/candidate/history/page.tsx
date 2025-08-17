import { CandidateShell } from "../../../components/layouts";
import { Card } from "../../../components/ui";

export default function History(){
  const rows = [
    {title:'Senior Consultant at Global Consulting Firm', date:'6/10/25 9:00 AM ET'},
    {title:'Finance Manager at Tech Innovators Inc.', date:'6/10/25 9:00 AM ET'},
    {title:'Independent Strategy Advisor', date:'6/10/25 9:00 AM ET'},
  ];
  return (
    <CandidateShell>
      <Card style={{padding:0}}>
        <table className="table">
          <thead><tr><th>Title</th><th>Call Date</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r, i)=>(<tr key={i}><td>{r.title}</td><td>{r.date}</td><td><a href="#">View Feedback</a></td></tr>))}
          </tbody>
        </table>
      </Card>
    </CandidateShell>
  )
}
