"use client";

import { Input, Button } from "../../../../components/ui";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function FeedbackForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [starsCategory1, setStarsCategory1] = useState("");
  const [starsCategory2, setStarsCategory2] = useState("");
  const [starsCategory3, setStarsCategory3] = useState("");
  const [actions, setActions] = useState("");
  const [text, setText] = useState("");

  const submitDisabled =
    !starsCategory1 || !starsCategory2 || !starsCategory3 || !actions || !text;

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
      starsCategory1: Number(formData.get("starsCategory1")),
      starsCategory2: Number(formData.get("starsCategory2")),
      starsCategory3: Number(formData.get("starsCategory3")),
      extraCategoryRatings: extra,
      actions: actionsText
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
      text: formData.get("text"),
    };

    const res = await fetch(`/api/feedback/${bookingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push(`/professional/requests`);
    } else {
      alert("Failed to submit feedback");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      <div className="col" style={{ gap: 4 }}>
        <h3>Category 1 Rating</h3>
        <p className="text-sm">Evaluate core technical skills.</p>
        <Input
          type="number"
          name="starsCategory1"
          min={1}
          max={5}
          value={starsCategory1}
          onChange={(e) => setStarsCategory1(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Category 2 Rating</h3>
        <p className="text-sm">Assess communication and collaboration.</p>
        <Input
          type="number"
          name="starsCategory2"
          min={1}
          max={5}
          value={starsCategory2}
          onChange={(e) => setStarsCategory2(e.target.value)}
          required
        />
      </div>
      <div className="col" style={{ gap: 4 }}>
        <h3>Category 3 Rating</h3>
        <p className="text-sm">Judge problem-solving approach.</p>
        <Input
          type="number"
          name="starsCategory3"
          min={1}
          max={5}
          value={starsCategory3}
          onChange={(e) => setStarsCategory3(e.target.value)}
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
        disabled={submitDisabled}
        variant={submitDisabled ? "muted" : "primary"}
      >
        Submit
      </Button>
    </form>
  );
}

