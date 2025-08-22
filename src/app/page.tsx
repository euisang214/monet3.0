import { PublicShell } from "../components/layouts";
import { Card } from "../components/ui";
import { auth } from "../../auth";
import { redirect } from "next/navigation";

export default async function Landing(){
  const session = await auth();
  if(session?.user){
    redirect(session.user.role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
  }
  return (
    <PublicShell>
      <section className="hero">
        <div>
          <h1 style={{fontSize:40, margin:0}}>Connect with Industry Experts</h1>
          <p style={{opacity:.9, maxWidth:520}}>
            Gain valuable insights and feedback from seasoned professionals in finance and consulting.
            Prepare for your next career move with confidence.
          </p>
          <div className="row" style={{gap:12, marginTop:16}}>
            <a className="btn btn-primary" href="/candidate/dashboard">Sign Up as a Candidate</a>
            <a className="btn" href="/professional/dashboard">Become a Professional</a>
          </div>
        </div>
        <img src="/brand/monet-wordmark.svg" width={180} alt="Monet"/>
      </section>

      <section id="about" className="grid grid-2" style={{marginTop:32}}>
        <Card className="col" style={{padding:16}}>
          <h2>For Candidates</h2>
          <p>Get personalized advice and practice your pitches with industry experts.</p>
          <ul>
            <li><strong>Get Expert Advice</strong> — Insights on trends, culture, and interview strategies.</li>
            <li><strong>Practice Your Pitches</strong> — Constructive feedback to refine your presentation.</li>
          </ul>
        </Card>
        <Card className="col" style={{padding:16}}>
          <h2>For Professionals</h2>
          <p>Share your knowledge and earn extra income.</p>
          <ul>
            <li><strong>Share Your Knowledge</strong> — Mentor the next generation of talent.</li>
            <li><strong>Earn Extra Income</strong> — Set your rate and schedule.</li>
          </ul>
        </Card>
      </section>

      <section id="how" style={{marginTop:24}}>
        <Card className="col" style={{padding:16}}>
          <h2>How It Works</h2>
          <ol>
            <li>Browse anonymized professionals by firm, title, seniority, and availability.</li>
            <li>Request a 30-minute call. Professionals accept/decline.</li>
            <li>Pay at checkout; Zoom link and calendar invites are created automatically.</li>
            <li>Provide feedback; QC gates payouts to professionals.</li>
          </ol>
        </Card>
      </section>

      <section id="contact" style={{marginTop:24}}>
        <Card className="col" style={{padding:16}}>
          <h2>Contact</h2>
          <p>Email: support@monet.local</p>
        </Card>
      </section>
    </PublicShell>
  );
}
