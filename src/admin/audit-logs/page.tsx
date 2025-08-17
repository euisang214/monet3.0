import { AdminShell } from "../../components/layouts";
import { Card } from "../../components/ui";

export default function Page(){
  return (
    <AdminShell>
      <Card style={padding:16}>
        <h2>Audit Logs</h2>
        <p>Minimalist data table with filters and CSV export.</p>
      </Card>
    </AdminShell>
  )
}
