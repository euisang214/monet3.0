import { Card, Button, Input } from "../../../components/ui";
import { auth } from "@/auth";
import { getProfessionalSettings } from "../../api/professional/settings";
import StripeSection from "./StripeSection";

export default async function ProSettings() {
  const session = await auth();
  const data = session?.user
    ? await getProfessionalSettings(session.user.id)
    : null;

  return (
    <Card style={{ padding: 16 }}>
      <h2>Settings</h2>
      <div className="grid grid-2">
        <div className="col" style={{ gap: 12 }}>
          <h3>Profile</h3>
          <label>Full name</label>
          <Input defaultValue={data?.fullName ?? ""} />
          <label>Email</label>
          <Input defaultValue={data?.email ?? ""} />
          <label>Timezone</label>
          <Input defaultValue={data?.timezone ?? ""} />

          <h3>Calendar</h3>
          <p>Connect your calendar to automatically block out busy times.</p>
          <Button>Connect Calendar</Button>
        </div>
        <div className="col" style={{ gap: 12 }}>
          <StripeSection />
          <h3>Verification Status</h3>
          <p>
            {data?.verified
              ? "Corporate email verified."
              : "Corporate email not yet verified."}
          </p>
        </div>
      </div>
    </Card>
  );
}

