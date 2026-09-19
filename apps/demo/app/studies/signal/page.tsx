"use client";

import { useState } from "react";
import { Button, ButtonLabel, Input } from "@anaphor/system";
import { WorkloadField } from "../shader";

const workloads = [
  { name: "inference-gateway", id: "sig_8f32", region: "iad-1", status: "Running", requests: 9842, latency: 42, compute: 76 },
  { name: "embedding-worker", id: "sig_7a19", region: "fra-1", status: "Running", requests: 6204, latency: 68, compute: 61 },
  { name: "image-pipeline", id: "sig_6c04", region: "sfo-1", status: "Degraded", requests: 4186, latency: 184, compute: 92 },
  { name: "search-indexer", id: "sig_5d87", region: "iad-1", status: "Running", requests: 3128, latency: 31, compute: 44 },
  { name: "nightly-evaluation", id: "sig_4b61", region: "fra-1", status: "Queued", requests: 1456, latency: 0, compute: 0 },
];
const buttonProps = { size: "md", shape: "square", loading: false, iconOnly: false, nativeButton: true, type: "button", tone: "neutral", variant: "outline" } as const;
const series = [23,29,25,32,31,27,34,36,30,39,37,34,44,48,40,46,52,48,50,43,57,62,56,60,51,66,69,63,72,64,70,75,68,78,73,79,71,75,83,76,85,81,78,89,82,88,80,84];

function TrafficChart({ hours }: { hours: number }) {
  const values = series.slice(-hours * 2);
  const points = values.map((value, i) => `${i * 700 / (values.length - 1)},${180 - value * 1.6}`).join(" ");
  return <div className="traffic-chart"><svg viewBox="0 0 700 200" role="img" aria-label={`Illustrative request traffic over ${hours} hours, trending upward from ${values[0]} to 84 percent of capacity.`}>
    {[20,70,120,170].map(y => <line key={y} x1="0" x2="700" y1={y} y2={y} className="chart-grid" />)}
    <polygon points={`0,190 ${points} 700,190`} fill="var(--anaphor-brand)" opacity=".07" />
    <polyline points={points} fill="none" stroke="var(--anaphor-brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg><div className="chart-axis"><span>{hours}h ago</span><span>{hours / 2}h ago</span><span>Now</span></div></div>;
}

export default function Signal() {
  const [dark, setDark] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hours, setHours] = useState(24);
  const [status, setStatus] = useState("All workloads");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = workloads.filter(row => (status === "All workloads" || row.status === status) && row.name.includes(query.toLowerCase()));
  function exportRows() {
    const csv = ["name,region,status,requests_per_minute,p95_ms,compute_percent", ...rows.map(row => [row.name,row.region,row.status,row.requests,row.latency,row.compute].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "signal-workloads.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main id="content" tabIndex={-1} className={`signal-study ${dark ? "dark" : ""}`}>
    <header className="signal-header"><div className="signal-wordmark"><span className="signal-mark" aria-hidden="true">⌁</span> Signal <span className="study-eyebrow">Compute observatory</span></div><Button {...buttonProps} onClick={() => setDark(!dark)}><ButtonLabel>{dark ? "Light mode" : "Dark mode"}</ButtonLabel></Button></header>
    <div className="signal-title-row"><div><p className="study-eyebrow">Workspace / Personal</p><h1>Overview</h1><p className="study-muted">Your workloads, at a glance.</p></div><div className="signal-title-actions"><span className="sample-label">Sample data · Sep 16</span><Button {...buttonProps} onClick={exportRows}><ButtonLabel>Export CSV ↓</ButtonLabel></Button></div></div>
    <section className="signal-summary" aria-label="Workspace metrics">
      <div className="signal-metric"><span className="study-eyebrow">Requests / min</span><strong>24,816</strong><span className="study-muted">↑ 12.8% from previous hour</span><div className="mini-bars" aria-hidden="true">{series.slice(-24).map((n,i) => <i key={i} style={{ height: `${n}%` }} />)}</div></div>
      <div className="signal-metric"><span className="study-eyebrow">P95 latency</span><strong>86<span> ms</span></strong><span className="study-muted">Target &lt; 100 ms</span><div className="metric-gauge"><i style={{ width: "86%" }} /></div><span className="study-eyebrow">14 ms headroom</span></div>
      <div className="signal-metric"><span className="study-eyebrow">Successful requests</span><strong>99.94<span>%</span></strong><span className="study-muted">Within your 99.9% target</span><div className="uptime-bars" aria-hidden="true">{Array.from({ length: 32 },(_,i) => <i key={i} className={i === 21 ? "uptime-dip" : ""} />)}</div><span className="study-eyebrow">Last 24 hours</span></div>
    </section>
    <div className="signal-analysis">
      <section className="signal-panel traffic-panel"><div className="panel-heading"><div><h2>Request volume</h2><p className="study-muted">All regions · relative capacity</p></div><label className="sr-only" htmlFor="traffic-period">Traffic period</label><select id="traffic-period" className="study-select" value={hours} onChange={event => setHours(Number(event.target.value))}><option value={24}>24 hours</option><option value={12}>12 hours</option><option value={6}>6 hours</option></select></div><TrafficChart hours={hours} /><div className="chart-caption"><span><i className="chart-key" /> Requests</span><span>Peak 89% · Now 84%</span></div></section>
      <section className="signal-panel field-panel"><div className="panel-heading"><div><h2>Compute field</h2><p className="study-muted">Interference study / 001</p></div><button type="button" className="text-control" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button></div><WorkloadField paused={paused} /><div className="field-caption"><span className="study-eyebrow">5 workloads / 3 regions</span><span className="study-muted">Generative visual, not telemetry</span></div></section>
    </div>
    <section className="signal-workloads"><div className="workloads-heading"><div><h2>Workloads <span className="study-muted">05</span></h2><p className="study-muted">Inspect a workload to see its allocation.</p></div><div className="workload-filters"><label className="sr-only" htmlFor="workload-search">Search workloads</label><Input id="workload-search" size="md" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search workloads…" /><label className="sr-only" htmlFor="workload-status">Workload status</label><select id="workload-status" className="study-select" value={status} onChange={event => setStatus(event.target.value)}>{["All workloads","Running","Degraded","Queued"].map(value => <option key={value}>{value}</option>)}</select></div></div>
      <div className="workload-scroll" role="region" aria-label="Workload data" tabIndex={0}><table className="workload-table"><thead><tr><th>Workload</th><th>Status</th><th>Region</th><th>Requests/min</th><th>P95</th><th>Compute</th></tr></thead><tbody>{rows.map(row => <WorkloadRow key={row.id} row={row} expanded={expanded === row.id} onToggle={() => setExpanded(expanded === row.id ? null : row.id)} />)}</tbody></table>{rows.length === 0 && <p className="empty-workloads" role="status">No workloads match. Try another name or status.</p>}</div>
      <div className="study-footnote" aria-live="polite">Showing {rows.length} of 5 workloads · A fictional workspace for studying real interface decisions.</div>
    </section>
  </main>;
}

function WorkloadRow({ row, expanded, onToggle }: { row: typeof workloads[number]; expanded: boolean; onToggle: () => void }) {
  return <><tr><th scope="row"><button type="button" className="workload-name" aria-expanded={expanded} aria-controls={`${row.id}-detail`} onClick={onToggle}><span aria-hidden="true">{expanded ? "−" : "+"}</span><span>{row.name}<small>{row.id}</small></span></button></th><td><span className={`workload-status ${row.status === "Degraded" ? "status-degraded" : ""}`}><i />{row.status}</span></td><td>{row.region}</td><td>{row.requests.toLocaleString("en-US")}</td><td>{row.latency ? `${row.latency} ms` : "—"}</td><td><span className="compute-cell"><span className="compute-meter"><i style={{ width: `${row.compute}%` }} /></span>{row.compute}%</span></td></tr><tr hidden={!expanded} id={`${row.id}-detail`}><td colSpan={6} className="workload-detail"><strong>{row.name}</strong><p>{row.status === "Degraded" ? "Elevated latency in sfo-1. This workload is using 92% of its compute allocation; consider increasing capacity." : row.status === "Queued" ? "Waiting for the next scheduled evaluation window. No compute is currently allocated." : `Serving traffic in ${row.region}. ${100-row.compute}% of allocated compute remains available.`}</p><span>Sample environment · No live infrastructure connected</span></td></tr></>;
}
