import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { PublicShell } from "../../components/layouts";
import { Card, Input, Button } from "../../components/ui";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
  }
  return (
    <PublicShell>
      <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
        <h1>Sign Up</h1>
        <form className="col" style={{ gap: 12 }}>
          <Input type="email" placeholder="Email" required />
          <Input type="password" placeholder="Password" required />
          <Button type="submit">Create Account</Button>
        </form>
        <p style={{ marginTop: 8 }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </Card>
    </PublicShell>
  );
}
