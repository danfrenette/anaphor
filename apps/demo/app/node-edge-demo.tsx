"use client";

import { Graph, Node, Edge } from './node-edge-graph';
import { extensions } from './node-edge-demo-state';
import { useNodeEdgeDemo } from './use-node-edge-demo';
import { Button, ButtonLabel, Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, Checkbox } from '@anaphor/system';
import styles from './node-edge-demo.module.css';

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'layers' ? <><path d="m4 8 8-4 8 4-8 4-8-4Zm0 4 8 4 8-4M4 16l8 4 8-4"/></> :
     name === 'half' ? <><circle cx="12" cy="12" r="7"/><path d="M12 5v14"/><path d="M12 5a7 7 0 0 1 0 14Z" fill="currentColor"/></> :
     name === 'shield' ? <path d="m12 3 7 3v6c0 4-7 9-7 9s-7-5-7-9V6l7-3Z"/> :
     name === 'folder' ? <path d="M3 7V5h7l2 3h9v11H3V7Z"/> :
     name === 'chrome' ? <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 9h7M9.4 13.5 6 7m7.5 7L10 20"/></> :
     name === 'play' ? <path d="m9 5 10 7-10 7V5Z" fill="currentColor" stroke="none"/> :
     name === 'stop' ? <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none"/> :
     name === 'reset' ? <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></> : <path d="m6 12 4 4 8-9"/>}
  </svg>;
}
function Study() {
  const { state, status, running, loop, setLoop, runExtension, play, stop, reset } = useNodeEdgeDemo();
  return <>
    <div className="canvas-scroll" tabIndex={0} role="region" aria-label="Shared state graph; scroll horizontally to explore">
      <div className="canvas">
        <div className="column-label source-label">01 / STATE</div><div className="column-label module-label">02 / EXTENSIONS</div><div className="column-label output-label">03 / RESULT</div>
        <Node nodeId="shared" id="graph-shared-state" className="shared node rounded-card">
          <Card>
            <CardHeader><CardTitle>Shared state</CardTitle><CardAction><span className={`status-dot ${running ? 'on' : ''}`} /></CardAction></CardHeader>
            <CardContent>
              <div className="state-row"><span>Model catalogue</span><span className="value"><b>{state.models}</b> models</span></div>
              <div className="state-row"><span>Skills</span><span className="value"><b>{state.skills}</b> discovered</span></div>
              <div className="state-bottom"><div><span>Tools</span><span className="value"><b>{state.tools}</b> available</span></div><div><span>Output limit</span><span className="value"><b>{state.limit}</b> tokens</span></div></div>
              <div className="state-footer"><span>revision</span><span>{String(state.revision).padStart(2,'0')}</span></div>
            </CardContent>
          </Card>
        </Node>
        <div className="modules">
          {extensions.map(m => <Node key={m.id} nodeId={m.id} className="module node rounded-card">
            <Card>
              <CardHeader>
                <CardTitle>{m.title}</CardTitle>
                <CardDescription>{m.detail}</CardDescription>
                <CardAction><Button variant="outline" tone="neutral" size="sm" iconOnly onClick={() => runExtension(m.id)} aria-label={`Run ${m.title}`}><Icon name={m.icon}/></Button></CardAction>
              </CardHeader>
            </Card>
          </Node>)}
        </div>
        <Node nodeId="allowlist" className="result node rounded-card">
          <Card><CardHeader><CardTitle>Allowlist</CardTitle><CardDescription>{state.allowed} models</CardDescription><CardAction><span className="result-icon"><Icon name="check"/></span></CardAction></CardHeader></Card>
        </Node>
      </div>
    </div>
    {extensions.map(m => <Edge key={m.id} edgeId={`shared-${m.id}`} from="shared" to={m.id}/>)}
    <Edge edgeId="policy-allowlist" from="policy" to="allowlist"/>
    <div className="transport">
      <div className="transport-actions">
        <Button variant="outline" tone="neutral" size="sm" onClick={running ? stop : play}><Icon name={running ? 'stop' : 'play'}/><ButtonLabel>{running ? 'Stop flow' : 'Play flow'}</ButtonLabel></Button>
        <Button variant="ghost" tone="neutral" size="sm" iconOnly aria-label="Reset diagram" onClick={reset}><Icon name="reset"/></Button>
        <label className="loop-control"><Checkbox aria-label="Loop" checked={loop} onCheckedChange={setLoop}/>Loop</label>
      </div>
      <p className="flow-status" role="status"><span className={`status-dot ${running ? 'on' : ''}`}/>{status}</p>
    </div>
    <p className="sr-only">Shared state connects to models.dev, Half limits, Company policy, Skills folder, and Chrome. Company policy also connects to the Allowlist. Use any extension’s run button to send an update into shared state and propagate it. This is a simulated flow.</p>
  </>;
}
export function NodeEdgeDemo() {
  return <section id="node-edge-graphs" className="scroll-mt-8 border-t border-border py-12">
    <header>
      <div className="flex items-center justify-between gap-6 text-label tracking-[0.08em] text-muted-foreground uppercase"><p>03.03 / Component</p><p>Status / Study</p></div>
      <h2 className="mt-8 text-title font-medium tracking-[-0.02em]">Node-edge graphs</h2>
      <p className="mt-3 prose-reading text-pretty">A change, carried forward. Connections show where an update can travel; a pulse carries it, and arrival lights the receiving card.</p>
    </header>
    <div className={`${styles.study} dark mt-8 rounded-card border border-border bg-background text-foreground`}>
      <div className="study-topline"><span>Shared state & extensions</span><span>Use an extension’s run button to send a pulse</span></div>
      <Graph><Study/></Graph>
    </div>
    <p className="mt-4 text-small text-muted-foreground">Simulated flow at half speed. Inspired by <a className="underline underline-offset-4" href="https://x.com/kitlangton/status/2096703869136867563" target="_blank" rel="noreferrer">Kit Langton’s diagram</a>.</p>
    <Card className="mt-8">
      <CardHeader><CardTitle>Declare the content and its connections</CardTitle><CardDescription>Place nodes with ordinary React and CSS. Graph identifiers are separate from native HTML IDs. Sequences are optional; actions can send individual pulses.</CardDescription></CardHeader>
      <CardContent><pre className="overflow-x-auto font-mono text-ui"><code>{`<Graph>
  <Node nodeId="request" id="request-card">
    <Card>Request content</Card>
  </Node>
  <Node nodeId="service">
    <Card>Service content</Card>
  </Node>
  <Edge edgeId="request-service" from="request" to="service" />
</Graph>`}</code></pre></CardContent>
    </Card>
  </section>;
}
