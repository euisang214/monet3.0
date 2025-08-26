import { Button, Card, Badge } from "../../../../components/ui";
import Image from "next/image";

interface ProfessionalResponse {
  identity: { name?: string; email?: string; redacted?: boolean };
  employer: string;
  title: string;
  seniority: string;
  priceUSD: number;
  tags: string[];
  verified?: boolean;
  bio?: string;
  experience?: { role: string; company: string; period?: string }[];
  education?: { school: string; degree: string; period?: string }[];
  interests?: string[];
  activities?: string[];
}

export default async function Detail({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/professionals/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load professional profile");
  }
  const pro: ProfessionalResponse = await res.json();

  const name = pro.identity.redacted ? "Professional" : pro.identity.name;
  const contactInfo = pro.identity.redacted
    ? "Identity redacted until booking is confirmed."
    : pro.identity.email;

  return (
    <section className="col" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--gray-200)",
            }}
          >
            <Image
              src="/globe.svg"
              alt={name || "avatar"}
              width={80}
              height={80}
            />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h2>{name}</h2>
            <div className="row" style={{ alignItems: "center", gap: 8 }}>
              <span>{pro.title}</span>
              {pro.verified && <Badge>Verified Expert</Badge>}
            </div>
            <span style={{ color: "var(--text-muted)" }}>{contactInfo}</span>
          </div>
        </div>
        <Button>Schedule a Call</Button>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <a className="badge">About</a>
        <a className="badge">Reviews</a>
      </div>

      <Card className="col" style={{ padding: 16, gap: 16 }}>
        <h3>Summary</h3>
        <p>{pro.bio ?? "Summary available after booking is confirmed."}</p>

        {pro.experience && pro.experience.length > 0 && (
          <>
            <h3>Experience</h3>
            <ul>
              {pro.experience.map((item, idx) => (
                <li key={idx}>
                  {item.role} at {item.company}
                  {item.period ? ` (${item.period})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}

        {pro.education && pro.education.length > 0 && (
          <>
            <h3>Education</h3>
            <ul>
              {pro.education.map((item, idx) => (
                <li key={idx}>
                  {item.degree}, {item.school}
                  {item.period ? ` (${item.period})` : ""}
                </li>
              ))}
            </ul>
          </>
        )}

        {pro.interests && pro.interests.length > 0 && (
          <>
            <h3>Interests</h3>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {pro.interests.map((interest) => (
                <Badge key={interest}>{interest}</Badge>
              ))}
            </div>
          </>
        )}

        {pro.activities && pro.activities.length > 0 && (
          <>
            <h3>Activities</h3>
            <ul>
              {pro.activities.map((activity, idx) => (
                <li key={idx}>{activity}</li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </section>
  );
}
