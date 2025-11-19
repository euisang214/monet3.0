"use client";

import { Input, Button } from "@/components/ui/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FeedbackValidationModal, type ValidationResult } from "./FeedbackValidationModal";

export default function FeedbackForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [contentRating, setContentRating] = useState("");
  const [deliveryRating, setDeliveryRating] = useState("");
  const [valueRating, setValueRating] = useState("");
  const [actions, setActions] = useState("");
  const [text, setText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDisabled =
    !contentRating || !deliveryRating || !valueRating || !actions || !text;

  async function validateFeedback(payload: any) {
    setIsValidating(true);
    try {
      const res = await fetch('/api/professional/feedback/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result: ValidationResult = await res.json();
        setValidationResult(result);
        setShowValidationModal(true);

        // If approved, proceed directly to submission after brief delay
        if (result.approved) {
          setTimeout(() => {
            setShowValidationModal(false);
            submitFeedback(payload);
          }, 2000);
        }
      } else {
        // If validation endpoint fails, proceed with submission anyway
        console.error('Validation failed, proceeding with submission');
        submitFeedback(payload);
      }
    } catch (error) {
      // If validation fails, proceed with submission anyway
      console.error('Validation error, proceeding with submission:', error);
      submitFeedback(payload);
    } finally {
      setIsValidating(false);
    }
  }

  async function submitFeedback(payload: any) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/professional/feedback/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/professional/requests`);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || data.message || "Failed to submit feedback. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const actionsText = (formData.get("actions") as string) || "";
    let extra: unknown = undefined;
    const extraRaw = formData.get("extraCategoryRatings") as string;
    if (extraRaw) {
      try {
        extra = JSON.parse(extraRaw);
      } catch {
        alert("Extra Category Ratings must be valid JSON");
        return;
      }
    }
    const payload = {
      contentRating: Number(formData.get("contentRating")),
      deliveryRating: Number(formData.get("deliveryRating")),
      valueRating: Number(formData.get("valueRating")),
      extraCategoryRatings: extra,
      actions: actionsText
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      text: formData.get("text"),
    };

    setPendingPayload(payload);
    await validateFeedback(payload);
  }

  function handleImprove() {
    setShowValidationModal(false);
    // User stays on the form to improve their feedback
  }

  function handleProceedAnyway() {
    setShowValidationModal(false);
    if (pendingPayload) {
      submitFeedback(pendingPayload);
    }
  }

  function handleModalClose() {
    // If approved, the modal auto-closes and submits
    // If not approved and user closes, they can improve
    if (validationResult?.approved && pendingPayload) {
      submitFeedback(pendingPayload);
    } else {
      setShowValidationModal(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      {submitError && (
        <div style={{ color: 'var(--error)', padding: '8px 12px', background: 'var(--error-bg, #fee2e2)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
          {submitError}
        </div>
      )}
      <div className="col" style={{ gap: 4 }}>
        <h3>Content Rating</h3>
        <p className="text-sm">Evaluate the quality and relevance of discussion content.</p>
        <Input
          type="number"
          name="contentRating"
          min={1}
          max={5}
          value={contentRating}
          onChange={(e) => setContentRating(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Delivery Rating</h3>
        <p className="text-sm">Assess communication clarity and engagement.</p>
        <Input
          type="number"
          name="deliveryRating"
          min={1}
          max={5}
          value={deliveryRating}
          onChange={(e) => setDeliveryRating(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Value Rating</h3>
        <p className="text-sm">Judge overall value and actionable insights provided.</p>
        <Input
          type="number"
          name="valueRating"
          min={1}
          max={5}
          value={valueRating}
          onChange={(e) => setValueRating(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Extra Category Ratings</h3>
        <p className="text-sm">Optional JSON of additional categories and scores.</p>
        <textarea name="extraCategoryRatings" className="input" rows={2} />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Action Items</h3>
        <p className="text-sm">List concrete next steps, one per line.</p>
        <textarea
          name="actions"
          className="input"
          rows={3}
          value={actions}
          onChange={(e) => setActions(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Written Feedback</h3>
        <p className="text-sm">Provide a narrative summary of the session.</p>
        <textarea
          name="text"
          className="input"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={submitDisabled || isValidating || isSubmitting}
        variant={submitDisabled ? "muted" : "primary"}
      >
        {isSubmitting ? "Submitting..." : isValidating ? "Validating..." : "Submit"}
      </Button>

      <FeedbackValidationModal
        isOpen={showValidationModal}
        onClose={handleModalClose}
        result={validationResult}
        onProceedAnyway={handleProceedAnyway}
        onImprove={handleImprove}
      />
    </form>
  );
}

