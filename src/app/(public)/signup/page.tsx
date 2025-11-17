import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card } from "@/components/ui/ui";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === 'PROFESSIONAL' ? '/professional/dashboard' : '/candidate/dashboard');
  }
  return (
      <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
        <h1>Sign Up</h1>
        <p style={{ margin: '8px 0' }}>
          Choose the type of account you'd like to create.
        </p>
        <ul style={{ marginBottom: 16 }}>
          <li><strong>Professional</strong> &ndash; post jobs and manage applicants.</li>
          <li><strong>Candidate</strong> &ndash; apply to jobs and track your applications.</li>
        </ul>
        <SignUpForm />
        <p style={{ marginTop: 8 }}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </Card>
  );
}
