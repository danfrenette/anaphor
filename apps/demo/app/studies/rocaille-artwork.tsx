"use client";

import { useLayoutEffect, useRef, useImperativeHandle, type RefObject } from "react";
import Image from "next/image";
import "./rocaille-artwork.css";
import { useStudy } from "./study-context";

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// Rocaille 2 by Xor (@XorDev), supplied by the user.
// https://x.com/XorDev/status/2015813875833225715
const fragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float zoom;
uniform float phase;
uniform float foldStrength;
out vec4 color;
void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y / (0.3 * zoom);
  vec3 sum = vec3(0.0);
  for (int layer = 1; layer <= 10; layer++) {
    float i = float(layer);
    vec2 v = p;
    for (int iteration = 1; iteration <= 9; iteration++) {
      float f = float(iteration);
      v += foldStrength * sin(v.yx * f + i + phase) / f;
    }
    sum += (cos(i + vec3(0.0, 1.0, 2.0)) + 1.0) / 6.0 / max(length(v), 0.0001);
  }
  // Equivalent to tanh(sum * sum), without positive exponential overflow.
  vec3 e = exp(-2.0 * sum * sum);
  color = vec4((1.0 - e) / (1.0 + e), 1.0);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function RocailleArtwork({ expanded, beginMorph, background = false }: { expanded: boolean; beginMorph: RefObject<() => void>; background?: boolean }) {
  const synchronize = useRef<() => void>(() => {});
  useImperativeHandle(beginMorph, () => () => synchronize.current(), []);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wake = useRef<() => void>(() => {});
  const study = useStudy();
  const { playing, zoom, revision, reducedMotion } = study;
  const { clock, composition, setComposition, advance } = background ? study.background : study;
  const settings = useRef({ playing: playing && !reducedMotion, zoom, reducedMotion });

  useLayoutEffect(() => {
    settings.current = { playing: playing && !reducedMotion, zoom, reducedMotion };
    wake.current();
  }, [playing, zoom, revision, reducedMotion]);

  useLayoutEffect(() => {
    const element = host.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    let disposeRenderer = () => {};
    let disposed = false;

    function initialize() {
      if (!element || !surface || disposed) return;
      disposeRenderer();
      element.dataset.renderer = "static";
      const gl = surface.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
      if (!gl) return;
      const vs = compile(gl, gl.VERTEX_SHADER, vertex);
      const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
      const program = gl.createProgram();
      if (!vs || !fs || !program) {
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (program) gl.deleteProgram(program);
        return;
      }
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const resolution = gl.getUniformLocation(program, "resolution");
      const zoom = gl.getUniformLocation(program, "zoom");
      const phase = gl.getUniformLocation(program, "phase");
      const foldStrength = gl.getUniformLocation(program, "foldStrength");
      const target = expanded ? 1 : 0;
      let from = composition.current ?? target;
      let started = performance.now();
      setComposition(from);
      let frame = 0;
      let visible = true;
      let previous = 0;

      function draw(now: number, force = false) {
        frame = 0;
        if (!gl || !surface || !element || !visible || document.hidden || gl.isContextLost()) { previous = 0; return; }
        const moving = composition.current !== target;
        if (!force && (settings.current.playing || moving) && previous && now - previous < 1000 / 30 - 0.5) {
          frame = requestAnimationFrame(draw);
          return;
        }
        if (settings.current.playing && previous) advance(Math.min((now - previous) / 1000, 0.1));
        gl.uniform2f(resolution, surface.width, surface.height);
        const progress = settings.current.reducedMotion ? 1 : Math.min(1, Math.max(0, (now - started) / 560));
        const eased = 1 - Math.pow(1 - progress, 3);
        const amount = progress === 1 ? target : from + (target - from) * eased;
        setComposition(amount);
        gl.uniform1f(zoom, settings.current.zoom * (1 + 0.35 * amount));
        gl.uniform1f(foldStrength, 1 - 0.15 * amount);
        gl.uniform1f(phase, clock.current);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        element.dataset.renderer = "webgl";
        if (settings.current.playing || amount !== target) {
          previous = now;
          frame = requestAnimationFrame(draw);
        } else previous = 0;
      }

      function requestDraw() { if (!frame) frame = requestAnimationFrame(draw); }
      wake.current = requestDraw;
      // React calls onShare when the native transition is ready to animate.
      synchronize.current = () => {
        from = composition.current ?? target;
        started = performance.now();
        requestDraw();
      };
      function resize() {
        if (!surface || !gl) return;
        const bounds = surface.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(400_000 / Math.max(bounds.width * bounds.height, 1)));
        surface.width = Math.max(1, Math.floor(bounds.width * ratio));
        surface.height = Math.max(1, Math.floor(bounds.height * ratio));
        gl.viewport(0, 0, surface.width, surface.height);
        cancelAnimationFrame(frame);
        draw(performance.now(), true);
      }
      const resizes = new ResizeObserver(resize);
      resizes.observe(surface);
      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible) requestDraw();
        else { cancelAnimationFrame(frame); frame = 0; previous = 0; }
      });
      visibility.observe(surface);
      document.addEventListener("visibilitychange", requestDraw);
      resize();

      disposeRenderer = () => {
        cancelAnimationFrame(frame);
        resizes.disconnect();
        visibility.disconnect();
        document.removeEventListener("visibilitychange", requestDraw);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        wake.current = () => {};
        synchronize.current = () => {};
      };
    }

    function lost(event: Event) {
      event.preventDefault();
      disposeRenderer();
      if (element) element.dataset.renderer = "static";
    }
    surface.addEventListener("webglcontextlost", lost);
    surface.addEventListener("webglcontextrestored", initialize);
    // Defer GPU resource creation until the framed study approaches the viewport.
    const nearby = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { nearby.disconnect(); initialize(); }
    }, { rootMargin: "200px" });
    const bounds = surface.getBoundingClientRect();
    if (bounds.top < window.innerHeight + 200 && bounds.bottom > -200) initialize();
    else nearby.observe(surface);
    return () => {
      disposed = true;
      nearby.disconnect();
      disposeRenderer();
      surface.removeEventListener("webglcontextlost", lost);
      surface.removeEventListener("webglcontextrestored", initialize);
    };
  }, [clock, composition, setComposition, advance, expanded]);

  return <div ref={host} className="rocaille-artwork" data-renderer="static" role="img" aria-label="Rocaille 2: layered, multicolored waves folding through a dark field">
    <Image className="rocaille-poster" src="/studies/rocaille-2.png" alt="" fill unoptimized sizes="(max-width: 840px) 100vw, 1040px" />
    <canvas ref={canvas} aria-hidden="true" />
    <span className="rocaille-fallback-label">Static preview</span>
  </div>;
}
