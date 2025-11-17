'use client';

import { Modal, Button } from '@/components/ui';

export type ValidationResult = {
  approved: boolean;
  message?: string;
  issues?: string[];
  suggestions?: string[];
  note?: string;
};

type FeedbackValidationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  result: ValidationResult | null;
  onProceedAnyway: () => void;
  onImprove: () => void;
};

export function FeedbackValidationModal({
  isOpen,
  onClose,
  result,
  onProceedAnyway,
  onImprove,
}: FeedbackValidationModalProps) {
  if (!result) return null;

  const { approved, message, issues, suggestions, note } = result;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {approved ? (
          <>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                }}
              >
                ✅
              </div>
              <h2 style={{ marginTop: 0, color: '#22c55e' }}>
                Feedback Looks Great!
              </h2>
              <p style={{ marginBottom: '24px' }}>
                {message || 'Your feedback is detailed and valuable. Ready to submit!'}
              </p>
              {note && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  {note}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button onClick={onClose} variant="primary">
                Submit Feedback
              </Button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                }}
              >
                ⚠️
              </div>
              <h2 style={{ marginTop: 0, color: '#f59e0b' }}>
                Feedback Could Be Improved
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Our quality check found some areas that could use more detail.
              </p>
            </div>

            {issues && issues.length > 0 && (
              <div
                style={{
                  backgroundColor: '#fef3c7',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '8px' }}>
                  Issues Found:
                </h3>
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  {issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestions && suggestions.length > 0 && (
              <div
                style={{
                  backgroundColor: '#dbeafe',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '8px' }}>
                  Suggestions for Improvement:
                </h3>
                <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  {suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div
              style={{
                backgroundColor: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <strong>Why does this matter?</strong> High-quality feedback helps candidates
              improve and increases your reputation on the platform. Better feedback leads to
              faster payouts and more booking requests.
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button onClick={onImprove} variant="primary" style={{ flex: 1 }}>
                Improve Feedback
              </Button>
              <Button onClick={onProceedAnyway} variant="muted" style={{ flex: 1 }}>
                Submit Anyway
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
