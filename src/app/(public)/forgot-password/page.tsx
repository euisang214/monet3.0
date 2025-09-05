import { Card } from '../../../components/ui';
import ForgotPasswordForm from './ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <Card style={{ maxWidth: 400, margin: '40px auto', padding: 24 }}>
      <h1>Forgot Password</h1>
      <ForgotPasswordForm />
    </Card>
  );
}
