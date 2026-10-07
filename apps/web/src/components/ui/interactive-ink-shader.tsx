import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function InteractiveInkShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // Generate 5 random drop positions once on mount
  const [drops] = useState(() => [
    { x: 0.1 + Math.random() * 0.15, y: 0.1 + Math.random() * 0.15 }, // Top left
    { x: 0.75 + Math.random() * 0.15, y: 0.1 + Math.random() * 0.15 }, // Top right
    { x: 0.1 + Math.random() * 0.15, y: 0.75 + Math.random() * 0.15 }, // Bottom left
    { x: 0.75 + Math.random() * 0.15, y: 0.75 + Math.random() * 0.15 }, // Bottom right
    { x: 0.65 + Math.random() * 0.1, y: 0.45 + Math.random() * 0.2 }  // Mid right (behind login)
  ])

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
uniform vec2 u_drop1;
uniform vec2 u_drop2;
uniform vec2 u_drop3;
uniform vec2 u_drop4;
uniform vec2 u_drop5;
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

    float t = clamp(u_time * 0.85, 0.0, 10.0);
    float dropProgress = smoothstep(0.0, 3.2, t);

    vec2 dropCenter1 = vec2(u_drop1.x * aspect, u_drop1.y);
    vec2 dropCenter2 = vec2(u_drop2.x * aspect, u_drop2.y);
    vec2 dropCenter3 = vec2(u_drop3.x * aspect, u_drop3.y);
    vec2 dropCenter4 = vec2(u_drop4.x * aspect, u_drop4.y);
    vec2 dropCenter5 = vec2(u_drop5.x * aspect, u_drop5.y);

    vec2 warp = vec2(fbm(uv * 3.5 + vec2(0.1, 0.2)), fbm(uv * 3.5 + vec2(2.3, 1.4)));
    vec2 warpedUV = uv + warp * 0.28;

    float d1 = length(warpedUV - dropCenter1);
    float d2 = length(warpedUV - dropCenter2);
    float d3 = length(warpedUV - dropCenter3);
    float d4 = length(warpedUV - dropCenter4);
    float d5 = length(warpedUV - dropCenter5);

    float mouseDist = length(warpedUV - mouse);
    float mouseInteract = smoothstep(0.35, 0.02, mouseDist) * 0.85;

    // Increased ink radius (density)
    float inkRadius1 = 0.85 * dropProgress;
    float inkRadius2 = 0.75 * dropProgress;
    float inkRadius3 = 0.65 * dropProgress;
    float inkRadius4 = 0.70 * dropProgress;
    float inkRadius5 = 0.80 * dropProgress;

    float ink1 = smoothstep(inkRadius1, inkRadius1 * 0.2, d1);
    float ink2 = smoothstep(inkRadius2, inkRadius2 * 0.2, d2);
    float ink3 = smoothstep(inkRadius3, inkRadius3 * 0.2, d3);
    float ink4 = smoothstep(inkRadius4, inkRadius4 * 0.2, d4);
    float ink5 = smoothstep(inkRadius5, inkRadius5 * 0.2, d5);

    float filaments = smoothstep(0.1, 0.7, fbm(warpedUV * 7.0 - vec2(u_time * 0.05, u_time * 0.03)));
    
    // Combine all 5 drops
    float totalInk = max(ink1, max(ink2 * 0.95, max(ink3 * 0.85, max(ink4 * 0.9, ink5 * 0.8))));
    totalInk += mouseInteract;
    totalInk *= (0.85 + 0.35 * filaments);

    vec3 paperBase = vec3(0.965, 0.945, 0.902);
    vec3 agedParchment = vec3(0.918, 0.886, 0.816);

    float fiber = paperFiber(uv);
    vec3 paperColor = mix(paperBase, agedParchment, clamp(fiber * 0.45 + (1.0 - st.y) * 0.12, 0.0, 1.0));

    // Darker, denser ink colors
    vec3 deepInk = vec3(0.04, 0.03, 0.03);
    vec3 inkWash = vec3(0.18, 0.15, 0.14);
    vec3 inkEdge = vec3(0.30, 0.25, 0.22);

    float inkGrad = smoothstep(0.02, 0.90, totalInk);
    vec3 inkColor = mix(inkEdge, mix(inkWash, deepInk, smoothstep(0.2, 0.95, totalInk)), inkGrad);

    float edgeFeather = smoothstep(0.01, 0.3, totalInk) * (1.0 - smoothstep(0.3, 0.7, totalInk));
    paperColor -= edgeFeather * 0.12 * vec3(0.3, 0.25, 0.2);

    vec3 finalColor = mix(paperColor, inkColor, clamp(totalInk * 1.15, 0.0, 0.98));

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
    const vertexShader = cs(gl.VERTEX_SHADER, vs)
    const fragmentShader = cs(gl.FRAGMENT_SHADER, fs)
    if (!vertexShader || !fragmentShader) return
    
    gl.attachShader(prog, vertexShader)
    gl.attachShader(prog, fragmentShader)
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
    
    const uDrop1 = gl.getUniformLocation(prog, 'u_drop1')
    const uDrop2 = gl.getUniformLocation(prog, 'u_drop2')
    const uDrop3 = gl.getUniformLocation(prog, 'u_drop3')
    const uDrop4 = gl.getUniformLocation(prog, 'u_drop4')
    const uDrop5 = gl.getUniformLocation(prog, 'u_drop5')

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

    let animationFrameId: number
    const startTime = performance.now()

    function render(time: number) {
      if (!gl || !canvas) return
      if (typeof ResizeObserver === 'undefined') syncSize()
      
      const t = (time - startTime)
      gl.viewport(0, 0, canvas.width, canvas.height)
      
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y)
      
      if (uDrop1) gl.uniform2f(uDrop1, drops[0].x, drops[0].y)
      if (uDrop2) gl.uniform2f(uDrop2, drops[1].x, drops[1].y)
      if (uDrop3) gl.uniform2f(uDrop3, drops[2].x, drops[2].y)
      if (uDrop4) gl.uniform2f(uDrop4, drops[3].x, drops[3].y)
      if (uDrop5) gl.uniform2f(uDrop5, drops[4].x, drops[4].y)
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      
      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }
    
    animationFrameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [prefersReducedMotion, drops])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ display: 'block' }} 
    />
  )
}
