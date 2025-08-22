import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { Card } from "../../components/ui";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
  }
  return (
      <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
        <h1>Log In</h1>
        <LoginForm />
        <p style={{ marginTop: 8 }}>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>
      </Card>
  );
}
