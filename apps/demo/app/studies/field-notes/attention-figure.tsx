"use client";

import { useState } from "react";

export function AttentionFigure() {
  const [density, setDensity] = useState(2);
  return <figure className="attention-figure">
    <div className="attention-diagram" aria-hidden="true">{Array.from({ length: 21 }, (_, index) => <span key={index} className={index === 10 ? "attention-target" : ""} style={{ opacity: index === 10 ? 1 : ((index * 7) % 11) < density ? .65 : .08 }}>{index === 10 ? "Your next step" : ""}</span>)}</div>
    <div className="attention-controls"><label htmlFor="attention-density">Competing signals <output htmlFor="attention-density">{density}</output></label><input id="attention-density" type="range" min="0" max="10" value={density} onChange={event => setDensity(Number(event.target.value))} /><div className="chart-axis"><span>Quiet</span><span>Busy</span></div></div>
    <figcaption>01 — Same focal point, different surroundings. Move the slider to add visual competition. Nothing here needs to animate.</figcaption>
  </figure>;
}
