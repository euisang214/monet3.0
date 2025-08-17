import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { PublicShell } from "../../components/layouts";
import { Card, Input, Button } from "../../components/ui";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
  }
  return (
    <PublicShell>
      <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
        <h1>Log In</h1>
        <form className="col" style={{ gap: 12 }}>
          <Input type="email" placeholder="Email" required />
          <Input type="password" placeholder="Password" required />
          <Button type="submit">Log In</Button>
        </form>
        <p style={{ marginTop: 8 }}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>
      </Card>
    </PublicShell>
  );
}
