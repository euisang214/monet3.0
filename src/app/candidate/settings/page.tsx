import { Card, Button, Input } from "../../../components/ui";
import { auth } from "@/auth";
import { getCandidateSettings } from "../../../app/api/candidate/settings";
import ResumePreview from "../../../components/ResumePreview";

export default async function CandidateSettings() {
  const session = await auth();
  const data = session?.user ? await getCandidateSettings(session.user.id) : null;

  return (
      <div className="grid grid-2">
        <Card className="col" style={{padding:16}}>
          <h3>Account</h3>
          <label>Name</label>
          <Input defaultValue={session?.user?.name ?? ""}/>
          <label>Email</label>
          <Input defaultValue={data?.email ?? ""}/>
          <label>Resume Upload</label>
          <Input type="file"/>
          {data?.resumeUrl && (
            <>
              <a href={data.resumeUrl} target="_blank" rel="noopener noreferrer">Download Current Resume</a>
              <ResumePreview url={data.resumeUrl} />
            </>
          )}
          <label>Password</label>
          <Input type="password" defaultValue="***************"/>
          <div className="row" style={{gap:8, marginTop:12}}>
            <Button>Save Changes</Button>
            <Button variant="muted">Cancel</Button>
            <Button variant="danger">Delete Account</Button>
          </div>
        </Card>
        <Card className="col" style={{padding:16}}>
          <h3>Notifications</h3>
          <div className="col">
            <label><input type="checkbox" defaultChecked/> Feedback Received</label>
            <label><input type="checkbox" defaultChecked/> Chat Scheduled</label>
          </div>
          <h3 style={{marginTop:16}}>Success Fee</h3>
          <p>Optionally pledge 10% of any sign‑on bonus as a success fee.</p>
          <div className="row" style={{gap:8}}>
            <Input placeholder="Declared Bonus Amount (USD)"/>
            <Button>Generate Invoice</Button>
          </div>
        </Card>
      </div>
  )
}