'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContentInner() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  // If there's a token but no status/error, redirect to the API to process it
  useEffect(() => {
    if (token && !status && !error) {
      setLoading(true);
      window.location.href = `/api/shared/verification/confirm?token=${token}`;
    }
  }, [token, status, error]);

  // Loading state while redirecting to API
  if (loading || (token && !status && !error)) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Loader2
          size={48}
          style={{
            animation: 'spin 1s linear infinite',
            color: '#2563eb',
            marginBottom: 16
          }}
        />
        <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Verifying your email...</h2>
        <p style={{ margin: 0, color: '#475569' }}>Please wait while we confirm your email address.</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center' }}>
        <CheckCircle size={64} style={{ color: '#16a34a', marginBottom: 16 }} />
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Email Verified!</h1>
        <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
          Your corporate email has been successfully verified. You can now continue setting up your professional profile.
        </p>
        <div style={{
          background: '#f1f5f9',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          borderLeft: '4px solid #16a34a'
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#0f172a' }}>
            <strong>Next step:</strong> Return to the signup page to complete your profile and connect your Stripe account for payouts.
          </p>
        </div>
        <Link
          href="/signup/details"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Continue Setup
        </Link>
      </div>
    );
  }

  // Already verified state
  if (status === 'already_verified') {
    return (
      <div style={{ textAlign: 'center' }}>
        <CheckCircle size={64} style={{ color: '#16a34a', marginBottom: 16 }} />
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Already Verified</h1>
        <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
          This email address has already been verified. You can continue with your profile setup.
        </p>
        <Link
          href="/signup/details"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Continue Setup
        </Link>
      </div>
    );
  }

  // Expired token error
  if (error === 'expired_token') {
    return (
      <div style={{ textAlign: 'center' }}>
        <Clock size={64} style={{ color: '#f59e0b', marginBottom: 16 }} />
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Link Expired</h1>
        <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
          This verification link has expired. Verification links are valid for 24 hours.
        </p>
        <div style={{
          background: '#fef3c7',
          padding: 16,
          borderRadius: 8,
          marginBottom: 24,
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#92400e' }}>
            Please return to the signup page and request a new verification email.
          </p>
        </div>
        <Link
          href="/signup/details"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // Invalid token error
  if (error === 'invalid_token') {
    return (
      <div style={{ textAlign: 'center' }}>
        <XCircle size={64} style={{ color: '#dc2626', marginBottom: 16 }} />
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Invalid Link</h1>
        <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
          This verification link is invalid or has already been used. Please request a new verification email.
        </p>
        <Link
          href="/signup/details"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Request New Link
        </Link>
      </div>
    );
  }

  // Missing token error
  if (error === 'missing_token') {
    return (
      <div style={{ textAlign: 'center' }}>
        <AlertCircle size={64} style={{ color: '#dc2626', marginBottom: 16 }} />
        <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Missing Token</h1>
        <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
          No verification token was provided. Please use the link from your verification email.
        </p>
        <Link
          href="/signup/details"
          style={{
            display: 'inline-block',
            background: '#2563eb',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          Return to Signup
        </Link>
      </div>
    );
  }

  // Default state - no params (user navigated directly)
  return (
    <div style={{ textAlign: 'center' }}>
      <AlertCircle size={64} style={{ color: '#475569', marginBottom: 16 }} />
      <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>Email Verification</h1>
      <p style={{ margin: '0 0 24px 0', color: '#475569', lineHeight: 1.6 }}>
        To verify your corporate email, please click the link in the verification email we sent you.
      </p>
      <p style={{ margin: '0 0 24px 0', color: '#475569', fontSize: 14 }}>
        If you haven't received the email, you can request a new one from the signup page.
      </p>
      <Link
        href="/signup/details"
        style={{
          display: 'inline-block',
          background: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Go to Signup
      </Link>
    </div>
  );
}

export default function VerifyEmailContent() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Loader2
          size={48}
          style={{
            animation: 'spin 1s linear infinite',
            color: '#2563eb',
            marginBottom: 16
          }}
        />
        <p style={{ margin: 0, color: '#475569' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <VerifyEmailContentInner />
    </Suspense>
  );
}
