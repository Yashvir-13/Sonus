'use client'

import React, { useEffect, useRef } from 'react'

export interface InteractiveInkShaderProps {
  className?: string
}

export function InteractiveInkShader({ className = '' }: InteractiveInkShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function syncSize() {
      if (!canvas) return
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(syncSize)
      observer.observe(canvas)
    }
    syncSize()

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

// Simplex/Perlin-style hash and noise
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal Brownian Motion for authentic organic watercolor / fibrous paper dispersion
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; ++i) {
        v += a * noise(p);
        p = rot * p * 2.05 + vec2(100.0);
        a *= 0.5;
    }
    return v;
}

// Micro paper texture / pores / wood pulp fiber
float paperFiber(vec2 p) {
    float n1 = noise(p * 45.0);
    float n2 = noise(p * 180.0);
    float grain = fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    return n1 * 0.4 + n2 * 0.35 + (grain - 0.5) * 0.25;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = st;
    uv.x *= aspect;

    vec2 mouse = u_mouse / u_resolution;
    mouse.x *= aspect;

    // Time-based emergence (drop-in on load and seep over 0 to 4 seconds)
    float t = clamp(u_time * 0.85, 0.0, 10.0);
    float dropProgress = smoothstep(0.0, 3.2, t);

    // Initial drop origins (right side / upper right ink seep)
    vec2 dropCenter1 = vec2(0.72 * aspect, 0.58);
    vec2 dropCenter2 = vec2(0.85 * aspect, 0.75);
    vec2 dropCenter3 = vec2(0.65 * aspect, 0.35);

    // Distances with organic fibrous warping (domain warping for ink capillary action)
    vec2 warp = vec2(fbm(uv * 3.5 + vec2(0.1, 0.2)), fbm(uv * 3.5 + vec2(2.3, 1.4)));
    vec2 warpedUV = uv + warp * 0.28;

    float d1 = length(warpedUV - dropCenter1);
    float d2 = length(warpedUV - dropCenter2);
    float d3 = length(warpedUV - dropCenter3);

    // Distance to interactive mouse pointer
    float mouseDist = length(warpedUV - mouse);
    float mouseInteract = smoothstep(0.35, 0.02, mouseDist) * 0.65;

    // Ink density accumulation
    float inkRadius1 = 0.45 * dropProgress;
    float inkRadius2 = 0.35 * dropProgress;
    float inkRadius3 = 0.30 * dropProgress;

    float ink1 = smoothstep(inkRadius1, inkRadius1 * 0.4, d1);
    float ink2 = smoothstep(inkRadius2, inkRadius2 * 0.3, d2);
    float ink3 = smoothstep(inkRadius3, inkRadius3 * 0.2, d3);

    // Dynamic wave ripple & seeping filaments
    float filaments = smoothstep(0.1, 0.7, fbm(warpedUV * 7.0 - vec2(u_time * 0.05, u_time * 0.03)));
    float totalInk = max(ink1, max(ink2 * 0.85, ink3 * 0.7));
    totalInk += mouseInteract;
    totalInk *= (0.75 + 0.35 * filaments);

    // 16th/17th Century antique laid paper base
    vec3 paperBase = vec3(0.965, 0.945, 0.902);
    vec3 agedParchment = vec3(0.918, 0.886, 0.816);

    // Fibers, pores, watermark-like density
    float fiber = paperFiber(uv);
    vec3 paperColor = mix(paperBase, agedParchment, clamp(fiber * 0.45 + (1.0 - st.y) * 0.12, 0.0, 1.0));

    // Ink tones (Deep charcoal sumi ink to warm dark umber wash)
    vec3 deepInk = vec3(0.08, 0.075, 0.07);
    vec3 inkWash = vec3(0.24, 0.22, 0.20);
    vec3 inkEdge = vec3(0.38, 0.33, 0.28);

    // Ink shading gradient from wash edge to deep core
    float inkGrad = smoothstep(0.05, 0.85, totalInk);
    vec3 inkColor = mix(inkEdge, mix(inkWash, deepInk, smoothstep(0.3, 0.9, totalInk)), inkGrad);

    // Capillary feathering edges at the boundary of paper & ink
    float edgeFeather = smoothstep(0.02, 0.25, totalInk) * (1.0 - smoothstep(0.25, 0.6, totalInk));
    paperColor -= edgeFeather * 0.08 * vec3(0.3, 0.25, 0.2);

    // Final composition
    vec3 finalColor = mix(paperColor, inkColor, clamp(totalInk * 1.05, 0.0, 0.96));

    // Vintage paper vignette and subtle age patina around boundaries
    float vignette = 1.0 - 0.25 * dot(st - 0.5, st - 0.5);
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
}`

    function cs(type: number, src: string) {
      if (!gl) return null
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()
    if (!prog) return
    const vShader = cs(gl.VERTEX_SHADER, vs)
    const fShader = cs(gl.FRAGMENT_SHADER, fs)
    if (!vShader || !fShader) return
    gl.attachShader(prog, vShader)
    gl.attachShader(prog, fShader)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width
        const ny = 1.0 - (event.clientY - rect.top) / rect.height
        mouse.x = nx * canvas.width
        mouse.y = ny * canvas.height
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let animationId: number
    const startTime = performance.now()

    function render(time: number) {
      if (!gl || !canvas) return
      if (typeof ResizeObserver === 'undefined') syncSize()
      
      const t = (time - startTime)
      gl.viewport(0, 0, canvas.width, canvas.height)
      
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationId = requestAnimationFrame(render)
    }
    
    animationId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className={\`\${className} overflow-hidden pointer-events-none\`}>
      <canvas
        ref={canvasRef}
        className="block w-full h-full pointer-events-auto"
      />
    </div>
  )
}

export default InteractiveInkShader
