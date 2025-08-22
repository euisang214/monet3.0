import { Card } from "../../components/ui";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Landing() {
  const session = await auth();
  if (session?.user) {
    redirect(
      session.user.role === "PROFESSIONAL"
        ? "/professional/dashboard"
        : "/candidate/dashboard"
    );
  }
  return (
    <>
      <section className="hero">
        <img src="/window.svg" alt="Meeting" width={300} />
        <div>
          <h1 style={{ fontSize: 40, margin: 0 }}>Connect with Industry Experts</h1>
          <p style={{ opacity: 0.9, maxWidth: 520 }}>
            Gain valuable insights and feedback from seasoned professionals in finance and
            consulting. Prepare for your next career move with confidence.
          </p>
          <div className="row" style={{ gap: 12, marginTop: 16 }}>
            <Link href="/signup" className="btn btn-primary">
              Sign Up as a Candidate
            </Link>
            <Link href="/signup" className="btn">
              Become an Expert
            </Link>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>For Candidates</h2>
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <Card className="col" style={{ padding: 24 }}>
            <img src="/globe.svg" alt="Advice" width={32} />
            <strong>Get Expert Advice</strong>
            <p>
              Connect with professionals who have walked the path you are on, and gain
              insights on trends, culture, and interview strategies.
            </p>
          </Card>
          <Card className="col" style={{ padding: 24 }}>
            <img src="/file.svg" alt="Practice" width={32} />
            <strong>Practice Your Pitches</strong>
            <p>
              Receive constructive feedback and build confidence in your presentation and
              communication skills.
            </p>
          </Card>
        </div>
      </section>

      <section style={{ marginTop: 48 }}>
        <h2>For Professionals</h2>
        <div className="grid grid-2" style={{ marginTop: 16 }}>
          <Card className="col" style={{ padding: 24 }}>
            <img src="/window.svg" alt="Share" width={32} />
            <strong>Share Your Knowledge</strong>
            <p>
              Make a difference in someone's career journey by mentoring and guiding aspiring
              candidates.
            </p>
          </Card>
          <Card className="col" style={{ padding: 24 }}>
            <img src="/globe.svg" alt="Earn" width={32} />
            <strong>Earn Extra Income</strong>
            <p>
              Set your own schedule and rates while getting paid for sharing your expertise.
            </p>
          </Card>
        </div>
      </section>

      <footer
        className="col"
        style={{ marginTop: 48, alignItems: "center", color: "var(--text-muted)" }}
      >
        <div className="row" style={{ gap: 16 }}>
          <Link href="#">Terms of Service</Link>
          <Link href="#">Privacy Policy</Link>
        </div>
        <div style={{ fontSize: 14 }}>
          &copy; 2024 ExpertConnect. All rights reserved.
        </div>
      </footer>
    </>
  );
}
