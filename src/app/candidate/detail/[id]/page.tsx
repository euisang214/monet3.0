import { Button, Card, Badge } from "../../../../components/ui";

export default function Detail(){
  return (
      <section className="col" style={{gap:16}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="col">
            <h2>Finance Professional</h2>
            <span className="badge">Verified Expert</span>
            <span style={{color:'var(--text-muted)'}}>Identity redacted until booking is confirmed.</span>
          </div>
          <Button>Schedule a Call</Button>
        </div>

        <div className="row" style={{gap:16}}>
          <a className="badge">About</a>
          <a className="badge">Reviews</a>
        </div>

        <Card className="col" style={{padding:16, gap:16}}>
          <h3>Summary</h3>
          <p>Experienced finance professional with a strong background in investment banking and financial analysis. Proven track record of success in managing portfolios, conducting market research, and providing strategic financial advice.</p>
          <h3>Experience</h3>
          <ul>
            <li>Senior Financial Analyst at Global Investments Inc. (2018 - Present)</li>
            <li>Financial Analyst at Regional Bank Corp. (2016 - 2018)</li>
          </ul>
          <h3>Education</h3>
          <ul>
            <li>MBA in Finance, University of Business</li>
            <li>B.S. in Economics, State University</li>
          </ul>
        </Card>
      </section>
  )
}
