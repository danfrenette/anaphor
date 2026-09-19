import Link from "next/link";

export const metadata = { title: "Studies · Anaphor" };

export default function Studies() {
  return <main id="content" tabIndex={-1} className="study-index">
    <p className="study-eyebrow">Anaphor / In use</p>
    <h1>One language.<br />Different conversations.</h1>
    <p className="study-intro">Studies put the system to work. The same type, color, and controls, shaped around two very different things: making a decision and following a thought.</p>
    <div className="study-covers">
      <Link href="/studies/signal" className="study-cover">
        <div className="signal-cover dark" aria-hidden="true"><span className="study-eyebrow">Signal / Compute observatory</span><div className="cover-orbit" /><span className="cover-number">24,816<span>requests / minute</span></span><svg viewBox="0 0 500 90"><path d="M0 70 L30 65 55 74 80 42 110 48 140 22 160 38 190 18 220 35 240 15 265 30 285 10 310 22 345 5 370 18 400 10 430 25 465 4 500 13" /></svg></div>
        <div className="study-cover-caption"><div><span className="study-eyebrow">01 / Application</span><h2>Signal</h2><p>Dense information. A clear next move.</p></div><span aria-hidden="true">↗</span></div>
      </Link>
      <Link href="/studies/field-notes" className="study-cover">
        <div className="article-cover" aria-hidden="true"><span className="study-eyebrow">Field Notes</span><span className="cover-article-title">Not everything<br />needs to move.</span><span className="cover-rule" /><p>A note on attention, interfaces,<br />and the value of leaving things alone.</p><span className="study-eyebrow">5 min read · No. 001</span></div>
        <div className="study-cover-caption"><div><span className="study-eyebrow">02 / Editorial</span><h2>Field Notes</h2><p>Room for a thought to unfold.</p></div><span aria-hidden="true">↗</span></div>
      </Link>
    </div>
    <p className="study-footnote">Working examples, not new themes. All data and article content are illustrative.</p>
  </main>;
}
