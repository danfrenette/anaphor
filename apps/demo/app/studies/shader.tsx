"use client";

import { useEffect, useRef } from "react";

// A bounded interference field, not a data encoding. The charts carry the data.
export function WorkloadField({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(0);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!canvas || !gl) return;
    const shaders: WebGLShader[] = [];
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return gl!.getShaderParameter(shader, gl!.COMPILE_STATUS) ? shader : null;
    }
    const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}");
    const fragment = compile(gl.FRAGMENT_SHADER, `precision mediump float;
      uniform vec2 resolution; uniform float time;
      void main(){
        vec2 uv=(gl_FragCoord.xy-.5*resolution)/resolution.y;
        float r=length(uv*vec2(.82,1.));
        float a=atan(uv.y,uv.x);
        float wave=sin(r*62.-time*.7+sin(a*5.+time*.15)*1.6);
        float threads=pow(max(0.,wave),14.);
        float envelope=(1.-smoothstep(.34,.58,r))*smoothstep(.06,.23,r);
        float light=threads*envelope*(.45+.55*sin(a*2.+time*.1)*sin(a*2.+time*.1));
        gl_FragColor=vec4(1.,1.,1.,light*.8);
      }`);
    const program = gl.createProgram();
    if (!program || !vertex || !fragment) {
      shaders.forEach(shader => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program); return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, visible = true, last = 0;
    function draw(now: number) {
      const ratio = Math.min(devicePixelRatio, 1.5);
      const width = Math.round(canvas!.clientWidth * ratio), height = Math.round(canvas!.clientHeight * ratio);
      if (canvas!.width !== width || canvas!.height !== height) { canvas!.width = width; canvas!.height = height; }
      gl!.viewport(0, 0, width, height);
      gl!.uniform2f(resolution, width, height);
      gl!.uniform1f(time, elapsed.current / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      last = now;
    }
    function tick(now: number) {
      if (now - last >= 1000 / 30) { elapsed.current += Math.min(now - last, 50); draw(now); }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame); draw(performance.now());
      if (!paused && !reduced.matches && visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; sync(); });
    observer.observe(canvas);
    const resize = new ResizeObserver(sync); resize.observe(canvas);
    reduced.addEventListener("change", sync); document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync);
      gl.deleteBuffer(buffer); shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteProgram(program);
    };
  }, [paused]);
  return <div className="workload-field" aria-hidden="true"><div className="field-fallback" /><canvas ref={ref} /></div>;
}
