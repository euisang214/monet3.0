import { Button, Card, Badge } from "../../../../components/ui";
import Image from "next/image";

interface ProfessionalResponse {
  identity: { name?: string; email?: string; redacted?: boolean };
  title: string;
  priceUSD: number;
  tags: string[];
  verified?: boolean;
  bio?: string;
  employer?: string;
  experience?: {
    firm: string;
    title: string;
    startDate?: string;
    endDate?: string;
  }[];
  education?: {
    school: string;
    title: string;
    startDate?: string;
    endDate?: string;
  }[];
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

  const name = pro.identity.redacted ? undefined : pro.identity.name;
  const heading = name ?? `${pro.title} at ${pro.employer}`;

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
              alt={heading || "avatar"}
              width={80}
              height={80}
            />
          </div>
          <div className="col" style={{ gap: 4 }}>
            {heading && <h2>{heading}</h2>}
            <span>{`Price per Session: $${pro.priceUSD}`}</span>
            <div className="row" style={{ alignItems: "center", gap: 8 }}>
              {pro.verified && <Badge>Verified Expert</Badge>}
            </div>
          </div>
        </div>
        <Button>Schedule a Call</Button>
      </div>

      <div className="row" style={{ gap: 16 }}>
        <a className="badge">About</a>
        <a className="badge">Reviews</a>
      </div>

      <Card className="col" style={{ padding: 16, gap: 24 }}>
        <div className="col" style={{ gap: 8 }}>
          <h3>Summary</h3>
          {pro.bio ? (
            <p>{pro.bio}</p>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No information available</p>
          )}
        </div>

        <div className="col" style={{ gap: 8 }}>
          <h3>Experience</h3>
          {pro.experience && pro.experience.length > 0 ? (
            <ul>
              {pro.experience.map((item, idx) => {
                const period =
                  item.startDate && item.endDate
                    ? `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`
                    : "";
                return (
                  <li key={idx}>
                    {item.title} at {item.firm}
                    {period ? ` (${period})` : ""}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No information available</p>
          )}
        </div>

        <div className="col" style={{ gap: 8 }}>
          <h3>Education</h3>
          {pro.education && pro.education.length > 0 ? (
            <ul>
              {pro.education.map((item, idx) => {
                const period =
                  item.startDate && item.endDate
                    ? `${new Date(item.startDate).getFullYear()}-${new Date(item.endDate).getFullYear()}`
                    : "";
                return (
                  <li key={idx}>
                    {item.title}, {item.school}
                    {period ? ` (${period})` : ""}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No information available</p>
          )}
        </div>

        <div className="col" style={{ gap: 8 }}>
          <h3>Interests</h3>
          {pro.interests && pro.interests.length > 0 ? (
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {pro.interests.map((interest) => (
                <Badge key={interest}>{interest}</Badge>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No information available</p>
          )}
        </div>

        <div className="col" style={{ gap: 8 }}>
          <h3>Activities</h3>
          {pro.activities && pro.activities.length > 0 ? (
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              {pro.activities.map((activity) => (
                <Badge key={activity}>{activity}</Badge>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>No information available</p>
          )}
        </div>
      </Card>
    </section>
  );
}
