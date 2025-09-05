import { Card } from '../../../components/ui';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
      <h1>Reset Password</h1>
      <ResetPasswordForm />
    </Card>
  );
}
