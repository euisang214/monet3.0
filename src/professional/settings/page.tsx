import { ProfessionalShell } from "../../components/layouts";
import { Card, Button, Input } from "../../components/ui";

export default function ProSettings(){
  return (
    <ProfessionalShell>
      <Card style={{padding:16}}>
        <h2>Settings</h2>
        <div className="grid grid-2">
          <div className="col" style={{gap:12}}>
            <h3>Profile</h3>
            <label>Full name</label>
            <Input defaultValue="First Last"/>
            <label>Email</label>
            <Input defaultValue="pro1@monet.local"/>
            <label>Timezone</label>
            <Input defaultValue="America/New_York"/>

            <h3>Calendar</h3>
            <p>Connect your calendar to automatically block out busy times.</p>
            <Button>Connect Calendar</Button>
          </div>
          <div className="col" style={{gap:12}}>
            <h3>Payment</h3>
            <p>Onboard to Stripe Connect to receive payouts.</p>
            <Button>Connect Stripe</Button>
            <h3>Verification Status</h3>
            <p>Corporate email not yet verified.</p>
          </div>
        </div>
      </Card>
    </ProfessionalShell>
  )
}
