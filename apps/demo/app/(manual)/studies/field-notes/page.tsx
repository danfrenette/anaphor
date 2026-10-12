import { AttentionFigure } from "./attention-figure";

export const metadata = { title: "Not everything needs to move · Field Notes" };

export default function FieldNotes() {
  return <main id="content" tabIndex={-1} className="field-notes-study mx-auto max-w-editorial px-page-inset">
    <header className="notes-masthead"><a href="#article">Field Notes</a><span className="study-eyebrow">A personal notebook</span></header>
    <article id="article" className="notes-article">
      <header><p className="study-eyebrow">Design engineering · No. 001</p><h1>Not everything<br />needs to move.</h1><p className="notes-deck">A note on attention, interfaces, and the value of leaving things alone.</p><div className="notes-meta"><span>An Anaphor study</span><span>September 16, 2026</span><span>5 min read</span></div></header>
      <div className="notes-body">
        <p>I used to add motion when an interface felt unfinished. A softer entrance. A little spring. One more thing that followed the pointer. Each change looked good in isolation, and somehow the whole thing became harder to use.</p>
        <p>The problem wasn’t any one animation. It was that everything was asking to be noticed.</p>
        <h2 id="attention">Attention is part of the layout</h2>
        <p>We make room for a heading by moving other things away from it. Motion needs the same kind of room. A transition only reads clearly when the rest of the interface is willing to stand still.</p>
        <p>Try the small example below. It doesn’t need a different palette or a bigger label. It needs fewer competing signals.</p>
        <AttentionFigure />
        <p>At the quiet end, the change has somewhere to land. At the busy end, you have to go looking for it. The amount of information hasn’t changed. Only the effort of finding it has.</p>
        <h2 id="useful-motion">Give movement a job</h2>
        <p>A panel can move to show where it came from. A button can respond to a press. An item can settle into its new place so you don’t have to find it again. These are useful jobs, and they’re usually over quickly.</p>
        <p>Other changes work better without a transition. Typing. Checking a box. Moving through a list with the keyboard. When an action is repeated often, the best response may be the one you never have to wait for.</p>
        <blockquote>A good default leaves you less to undo.</blockquote>
        <h2 id="leave-room">Leave a little room</h2>
        <p>This is what I want from a design system, too. Not a signature effect applied to every surface, but a few decisions that make the next decision easier.</p>
        <p>The dashboard in this study has a field of moving light. This page has a column of text. They share their foundations without needing to share their volume.</p>
        <p>Sometimes finishing an interface means finding the one thing you can let be still.</p>
      </div>
      <footer className="notes-end"><span className="notes-endmark" aria-hidden="true">a</span><p>Field Notes is an editorial study built with Anaphor.<br />An original sample essay, not a quotation from a reference site.</p><a href="/studies/signal">See the application study ↗</a></footer>
    </article>
  </main>;
}
