import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, Input, Button } from "../../../../components/ui";

export default async function ProvideFeedbackPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <section className="col" style={{ gap: 16 }}>
      <h2>Provide Feedback</h2>
      <Card className="col" style={{ padding: 16, gap: 16 }}>
        <form className="col" style={{ gap: 16 }}>
          <div className="col" style={{ gap: 4 }}>
            <h3>Category 1 Rating</h3>
            <p className="text-sm">Evaluate core technical skills.</p>
            <Input type="number" name="starsCategory1" min={1} max={5} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h3>Category 2 Rating</h3>
            <p className="text-sm">Assess communication and collaboration.</p>
            <Input type="number" name="starsCategory2" min={1} max={5} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h3>Category 3 Rating</h3>
            <p className="text-sm">Judge problem-solving approach.</p>
            <Input type="number" name="starsCategory3" min={1} max={5} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h3>Extra Category Ratings</h3>
            <p className="text-sm">Optional JSON of additional categories and scores.</p>
            <textarea name="extraCategoryRatings" className="input" rows={2} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h3>Action Items</h3>
            <p className="text-sm">List concrete next steps, one per line.</p>
            <textarea name="actions" className="input" rows={3} />
          </div>
          <div className="col" style={{ gap: 4 }}>
            <h3>Written Feedback</h3>
            <p className="text-sm">Provide a narrative summary of the session.</p>
            <textarea name="text" className="input" rows={5} />
          </div>
          <Button type="submit">Submit</Button>
        </form>
      </Card>
    </section>
  );
}
