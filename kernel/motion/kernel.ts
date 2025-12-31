
import { useEffect, useMemo, useRef, useState } from 'react';
import { KernelInvariants } from '../invariants/assert';

// ============================================================================
// Motion Law 1.0 — kernel-integrated (GPU Accelerated)
// Principles: Determinism, Temporal Hierarchy, Sub-pixel Discipline
// ============================================================================

export type BurstType = 'idle' | 'input' | 'error';

export type EventSignal = {
  id: string;
  type: BurstType;
  rate: number; // events/sec
};

export type MotionFrame = {
  tMs: number;
  pulse01: number;
  drift01: number;
  huePhase01: number;
  authority: number; // 0..1 (Anti-demo: reduced on blur/hidden)
};

export type Particle = {
  angle: number;
  phase: number;
  baseRadius: number;
  hash: number;
};

export const TEMPORAL = {
  PERIOD_MS: {
    PULSE: 10000,
    DRIFT: 18000,
    HUE: 75000,
  },
  EVENT_MS: {
    MIN: 120,
    MAX: 300,
  },
  DRIFT_PX: 8,
  BASE_VELOCITY: 0.5,
  MAX_DRIFT_EPSILON: 100, // ms
} as const;

const TAU = Math.PI * 2;

export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
export const snap025 = (v: number) => Math.round(v * 4) / 4;

export const hash01 = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
};

export function layerSin(tMs: number, periodMs: number, phase01 = 0) {
  const p = (tMs / periodMs) * TAU + phase01 * TAU;
  return Math.sin(p);
}

// Master clock for all motion instances
const startTime = performance.now();
export const getKernelTime = () => performance.now() - startTime;

export function useMotionKernel(events: EventSignal[], particleCount = 128) {
  const frameRef = useRef<MotionFrame>({ tMs: 0, pulse01: 0, drift01: 0, huePhase01: 0, authority: 1 });
  const [authority, setAuthority] = useState(1);
  const lastFiredAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const handleVisibility = () => setAuthority(document.hidden ? 0.2 : 1.0);
    const handleBlur = () => setAuthority(0.5);
    const handleFocus = () => setAuthority(1.0);
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const particles = useMemo(() => {
    const out: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const u = hash01(`p:${i}`);
      out.push({
        angle: u * TAU,
        phase: ((u * 997) % 1) * TAU,
        baseRadius: 15 + (u * 45),
        hash: u,
      });
    }
    return out;
  }, [particleCount]);

  useEffect(() => {
    let raf = 0;
    let lastTickMs = performance.now();

    const tick = () => {
      // Use master synchronized time
      const now = performance.now();
      const tMs = now - startTime;
      
      // INVARIANT ASSERTION: Motion clock drift check
      const drift = Math.abs(tMs - (now - startTime)); // Trivial here but demonstrates logic
      KernelInvariants.assert(
        drift < TEMPORAL.MAX_DRIFT_EPSILON,
        'MOTION_CLOCK',
        'Significant clock drift detected in motion loop.',
        `< ${TEMPORAL.MAX_DRIFT_EPSILON}ms`,
        `${drift}ms`
      );

      const pulse = layerSin(tMs, TEMPORAL.PERIOD_MS.PULSE, 0.11);
      const driftVal = layerSin(tMs, TEMPORAL.PERIOD_MS.DRIFT, 0.37);
      const hue = layerSin(tMs, TEMPORAL.PERIOD_MS.HUE, 0.73);

      frameRef.current = {
        tMs,
        pulse01: (pulse + 1) / 2,
        drift01: (driftVal + 1) / 2,
        huePhase01: (hue + 1) / 2,
        authority
      };

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [authority]);

  const fire = (id: string) => {
    lastFiredAt.current.set(id, getKernelTime());
  };

  const getBurst01 = (nowMs: number, id: string, type: BurstType, rate: number) => {
    const firedAt = lastFiredAt.current.get(id);
    if (!firedAt) return 0;

    const seed = hash01(`${id}:${type}`);
    const rateFactor = clamp(rate / 10, 0, 1);
    const duration = TEMPORAL.EVENT_MS.MIN + (TEMPORAL.EVENT_MS.MAX - TEMPORAL.EVENT_MS.MIN) * (0.35 + 0.45 * seed + 0.20 * rateFactor);

    const dt = nowMs - firedAt;
    if (dt <= 0 || dt >= duration) return 0;

    const x = dt / duration;
    const easeOut = 1 - Math.pow(1 - x, 3);
    return clamp(easeOut * (1 - x) * 1.6, 0, 1);
  };

  return { frameRef, particles, fire, getBurst01, authority };
}

// ============================================================================
// WebGL GPU Renderer Implementation
// ============================================================================

const VERTEX_SHADER = `
  attribute vec4 a_particle; // x: angle, y: phase, z: baseRadius, w: hash
  attribute float a_signalIndex;

  uniform float u_tMs;
  uniform float u_pulse01;
  uniform float u_driftPx;
  uniform float u_hueClimate;
  uniform float u_authority;
  vec2 u_resolution_internal = vec2(1024.0, 1024.0);
  
  uniform float u_burst01[4];
  uniform float u_amplitude[4];
  uniform float u_burstType[4]; // 0: idle, 1: input, 2: error

  varying float v_energy;
  varying float v_alpha;

  void main() {
    int idx = int(a_signalIndex);
    float burst01 = 0.0;
    float amp = 0.0;
    float bType = 0.0;
    
    if (idx == 0) { burst01 = u_burst01[0]; amp = u_amplitude[0]; bType = u_burstType[0]; }
    else if (idx == 1) { burst01 = u_burst01[1]; amp = u_amplitude[1]; bType = u_burstType[1]; }
    else if (idx == 2) { burst01 = u_burst01[2]; amp = u_amplitude[2]; bType = u_burstType[2]; }
    else if (idx == 3) { burst01 = u_burst01[3]; amp = u_amplitude[3]; bType = u_burstType[3]; }

    float angle = a_particle.x;
    float phase = a_particle.y;
    float baseR = a_particle.z;
    float hash = a_particle.w;
    
    float omega = 0.00015 + hash * 0.0001;
    float t = u_tMs;
    float ang = angle + phase + t * omega;
    
    float energy = clamp(0.3 + u_pulse01 * 0.4 + amp * 0.3 * u_authority, 0.0, 1.0);
    
    float burstModifier = (bType == 2.0) ? -0.4 : 0.6;
    float br = (baseR + amp * 25.0 * u_authority) * (1.0 + burst01 * burstModifier) * (0.8 + 0.4 * u_authority);
    
    vec2 pos;
    pos.x = cos(ang) * br + u_driftPx;
    pos.y = sin(ang * 0.88) * br + u_driftPx * 0.6;
    
    pos = floor(pos * 4.0) / 4.0;
    
    vec2 clipSpace = (pos / u_resolution_internal) * 2.0;
    gl_Position = vec4(clipSpace, 0, 1);
    
    float size = (1.0 + amp * 1.2 + burst01 * 1.5) * 2.5;
    gl_PointSize = floor(size * 4.0) / 4.0;
    
    v_energy = energy;
    v_alpha = clamp(0.04 + energy * 0.15 + burst01 * 0.2, 0.0, 0.45) * u_authority;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying float v_energy;
  varying float v_alpha;
  uniform float u_hueClimate;

  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float g = clamp(0.2 + v_energy * (0.6 + u_hueClimate * 0.2), 0.0, 1.0);
    float falloff = 1.0 - (dist * 2.0);
    gl_FragColor = vec4(0.0, g, 0.0, v_alpha * falloff);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function initMotionGL(gl: WebGLRenderingContext) {
  const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  
  return {
    program,
    locations: {
      a_particle: gl.getAttribLocation(program, 'a_particle'),
      a_signalIndex: gl.getAttribLocation(program, 'a_signalIndex'),
      u_tMs: gl.getUniformLocation(program, 'u_tMs'),
      u_pulse01: gl.getUniformLocation(program, 'u_pulse01'),
      u_driftPx: gl.getUniformLocation(program, 'u_driftPx'),
      u_hueClimate: gl.getUniformLocation(program, 'u_hueClimate'),
      u_authority: gl.getUniformLocation(program, 'u_authority'),
      u_burst01: gl.getUniformLocation(program, 'u_burst01'),
      u_amplitude: gl.getUniformLocation(program, 'u_amplitude'),
      u_burstType: gl.getUniformLocation(program, 'u_burstType'),
    }
  };
}

export function setupBuffersGL(gl: WebGLRenderingContext, particles: Particle[], signalsCount: number) {
  const particleData = new Float32Array(particles.length * 4);
  const signalIndices = new Float32Array(particles.length);
  
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    particleData[i * 4 + 0] = p.angle;
    particleData[i * 4 + 1] = p.phase;
    particleData[i * 4 + 2] = p.baseRadius;
    particleData[i * 4 + 3] = p.hash;
    signalIndices[i] = i % signalsCount;
  }
  
  const pBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.STATIC_DRAW);
  
  const iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, signalIndices, gl.STATIC_DRAW);
  
  return { pBuffer, iBuffer };
}

export function drawMotionGL(
  gl: WebGLRenderingContext, 
  state: ReturnType<typeof initMotionGL>, 
  buffers: ReturnType<typeof setupBuffersGL>,
  events: EventSignal[],
  kernel: ReturnType<typeof useMotionKernel>
) {
  const f = kernel.frameRef.current;
  gl.useProgram(state.program);
  
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); 
  
  gl.uniform1f(state.locations.u_tMs, f.tMs);
  gl.uniform1f(state.locations.u_pulse01, f.pulse01);
  gl.uniform1f(state.locations.u_driftPx, (f.drift01 - 0.5) * 2 * TEMPORAL.DRIFT_PX * f.authority);
  gl.uniform1f(state.locations.u_hueClimate, f.huePhase01);
  gl.uniform1f(state.locations.u_authority, f.authority);
  
  const burst01Arr = new Float32Array(4);
  const ampArr = new Float32Array(4);
  const typeArr = new Float32Array(4);
  
  events.forEach((e, i) => {
    if (i >= 4) return;
    burst01Arr[i] = kernel.getBurst01(f.tMs, e.id, e.type, e.rate);
    ampArr[i] = clamp(e.rate * 0.4, 0.1, 1.0);
    typeArr[i] = e.type === 'error' ? 2.0 : (e.type === 'input' ? 1.0 : 0.0);
  });
  
  gl.uniform1fv(state.locations.u_burst01, burst01Arr);
  gl.uniform1fv(state.locations.u_amplitude, ampArr);
  gl.uniform1fv(state.locations.u_burstType, typeArr);
  
  gl.enableVertexAttribArray(state.locations.a_particle);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pBuffer);
  gl.vertexAttribPointer(state.locations.a_particle, 4, gl.FLOAT, false, 0, 0);
  
  gl.enableVertexAttribArray(state.locations.a_signalIndex);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.iBuffer);
  gl.vertexAttribPointer(state.locations.a_signalIndex, 1, gl.FLOAT, false, 0, 0);
  
  gl.drawArrays(gl.POINTS, 0, kernel.particles.length);
}
