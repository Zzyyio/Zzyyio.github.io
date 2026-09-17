"use client";

import { useEffect, useRef } from "react";
import { getActiveLineSamples } from "@/lib/line-runtime";
import {
  type NormalizedPoint,
  type PortfolioRoute,
  routeShapes,
  sampleSmoothCurve,
} from "@/lib/visual-shapes";

type RippleFieldProps = {
  route: PortfolioRoute;
};

type DotParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  radius: number;
  size: number;
  alpha: number;
  seed: number;
};

// Primary tuning entry for the dot wake. Values are in CSS pixels or seconds.
const RIPPLE_TUNING = {
  dotsPerSide: 2,
  maximumParticles: 240,
  emissionDistance: 6,
  emissionStepDistance: 8,
  maximumEmissionSteps: 3,
  minimumPointSize: 1.15,
  pointSizeVariation: 2.15,
  minimumLifetime: 1.55,
  lifetimeVariation: 0.55,
  peakAlpha: 0.62,
  absorptionDistance: 24,
  maximumAttraction: 0.021,
  maximumPixelRatio: 1.5,
} as const;

const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in float a_size;
  in float a_alpha;
  uniform vec2 u_resolution;
  out float v_alpha;

  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = a_size;
    v_alpha = a_alpha;
  }
`;

const fragmentShaderSource = `#version 300 es
  precision highp float;
  in float v_alpha;
  out vec4 outColor;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float edge = 1.0 - smoothstep(0.34, 0.5, distanceFromCenter);
    if (edge < 0.02) discard;
    outColor = vec4(0.035, 0.035, 0.035, v_alpha * edge);
  }
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
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

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const time = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return time * time * (3 - 2 * time);
}

function nearestSample(
  particle: DotParticle,
  samples: NormalizedPoint[],
  width: number,
  height: number,
) {
  let nearestX = samples[0].x * width;
  let nearestY = samples[0].y * height;
  let minimumDistance = Number.POSITIVE_INFINITY;

  samples.forEach((sample) => {
    const x = sample.x * width;
    const y = sample.y * height;
    const distance = (particle.x - x) ** 2 + (particle.y - y) ** 2;
    if (distance < minimumDistance) {
      minimumDistance = distance;
      nearestX = x;
      nearestY = y;
    }
  });

  return {
    x: nearestX,
    y: nearestY,
    distance: Math.sqrt(minimumDistance),
  };
}

export function RippleField({ route }: RippleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const routeRef = useRef(route);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!canvas || !gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    const sizeBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const sizeLocation = gl.getAttribLocation(program, "a_size");
    const alphaLocation = gl.getAttribLocation(program, "a_alpha");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const particles: DotParticle[] = [];
    const pointer = {
      initialized: false,
      down: false,
      x: 0,
      y: 0,
      lastEmitX: 0,
      lastEmitY: 0,
    };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let animationFrame = 0;
    let previousTime = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = 1;

    const lineSamples = () => {
      const active = getActiveLineSamples();
      return active.length > 1
        ? active
        : sampleSmoothCurve(routeShapes[routeRef.current], 12);
    };

    const resize = () => {
      pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        RIPPLE_TUNING.maximumPixelRatio,
      );
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const emitDotWake = (
      x: number,
      y: number,
      dx: number,
      dy: number,
    ) => {
      if (reduceMotion) return;
      const movement = Math.hypot(dx, dy);
      if (movement < 0.5) return;

      const tangentX = dx / movement;
      const tangentY = dy / movement;
      const normalX = -tangentY;
      const normalY = tangentX;
      const speed = clamp(movement * 0.045, 0.35, 1.15);

      ([-1, 1] as const).forEach((side) => {
        for (let index = 0; index < RIPPLE_TUNING.dotsPerSide; index += 1) {
          const outward = 2 + Math.random() * 7;
          const trail = Math.random() * 11;
          const tangentJitter = (Math.random() - 0.5) * 6;
          const outwardVelocity = 0.62 + Math.random() * 1.12 + speed * 0.4;
          const radius =
            RIPPLE_TUNING.minimumPointSize +
            Math.random() * RIPPLE_TUNING.pointSizeVariation;

          particles.push({
            x:
              x +
              normalX * side * outward +
              tangentX * (tangentJitter - trail),
            y:
              y +
              normalY * side * outward +
              tangentY * (tangentJitter - trail),
            vx:
              normalX * side * outwardVelocity -
              tangentX * (0.08 + Math.random() * 0.22),
            vy:
              normalY * side * outwardVelocity -
              tangentY * (0.08 + Math.random() * 0.22),
            age: 0,
            life:
              RIPPLE_TUNING.minimumLifetime +
              Math.random() * RIPPLE_TUNING.lifetimeVariation,
            radius,
            size: radius,
            alpha: 0,
            seed: Math.random() * Math.PI * 2,
          });
        }
      });

      if (particles.length > RIPPLE_TUNING.maximumParticles) {
        particles.splice(
          0,
          particles.length - RIPPLE_TUNING.maximumParticles,
        );
      }
    };

    const setPointerOrigin = (event: PointerEvent) => {
      pointer.initialized = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastEmitX = event.clientX;
      pointer.lastEmitY = event.clientY;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.down = true;
      if (!pointer.initialized || event.pointerType === "touch") {
        setPointerOrigin(event);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.initialized) {
        setPointerOrigin(event);
        return;
      }

      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      const emitDx = event.clientX - pointer.lastEmitX;
      const emitDy = event.clientY - pointer.lastEmitY;
      const emitDistance = Math.hypot(emitDx, emitDy);
      const canEmit = event.pointerType !== "touch" || pointer.down;

      if (canEmit && emitDistance >= RIPPLE_TUNING.emissionDistance) {
        const steps = Math.min(
          RIPPLE_TUNING.maximumEmissionSteps,
          Math.max(
            1,
            Math.floor(emitDistance / RIPPLE_TUNING.emissionStepDistance),
          ),
        );
        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          emitDotWake(
            pointer.lastEmitX + emitDx * progress,
            pointer.lastEmitY + emitDy * progress,
            dx,
            dy,
          );
        }
        pointer.lastEmitX = event.clientX;
        pointer.lastEmitY = event.clientY;
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const onPointerUp = () => {
      pointer.down = false;
    };

    const onPointerLeave = () => {
      if (!pointer.down) pointer.initialized = false;
    };

    const render = (time: number) => {
      const deltaSeconds =
        previousTime === 0 ? 0.016 : Math.min(0.05, (time - previousTime) / 1000);
      const frameScale = deltaSeconds * 60;
      previousTime = time;
      const samples = lineSamples();

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.age += deltaSeconds;
        const lifeProgress = particle.age / particle.life;
        const attraction = smoothstep(0.14, 0.86, lifeProgress);
        const attractor = nearestSample(particle, samples, width, height);
        const spring =
          0.00055 +
          attraction * attraction * RIPPLE_TUNING.maximumAttraction;
        const turbulence =
          Math.sin(particle.age * 7 + particle.seed) *
          (1 - attraction) *
          0.018;

        particle.vx +=
          (attractor.x - particle.x) * spring * frameScale +
          turbulence * frameScale;
        particle.vy +=
          (attractor.y - particle.y) * spring * frameScale -
          turbulence * frameScale;
        const damping = Math.pow(0.958 - attraction * 0.078, frameScale);
        particle.vx *= damping;
        particle.vy *= damping;
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;

        const fadeIn = smoothstep(0, 0.055, lifeProgress);
        const fadeOut = 1 - smoothstep(0.67, 1, lifeProgress);
        const absorption =
          lifeProgress < 0.42
            ? 1
            : clamp(
                attractor.distance / RIPPLE_TUNING.absorptionDistance,
                0.04,
                1,
              );
        particle.alpha =
          RIPPLE_TUNING.peakAlpha * fadeIn * fadeOut * absorption;
        particle.size = Math.max(
          0.55,
          particle.radius *
            (0.74 + fadeOut * 0.26) *
            (attractor.distance < 28
              ? 0.42 + (attractor.distance / 28) * 0.58
              : 1),
        );

        if (lifeProgress >= 1 || particle.alpha < 0.005) {
          particles.splice(index, 1);
        }
      }

      const positions = new Float32Array(particles.length * 2);
      const sizes = new Float32Array(particles.length);
      const alphas = new Float32Array(particles.length);

      particles.forEach((particle, index) => {
        positions[index * 2] = particle.x * pixelRatio;
        positions[index * 2 + 1] = particle.y * pixelRatio;
        sizes[index] = particle.size * pixelRatio;
        alphas[index] = particle.alpha;
      });

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(sizeLocation);
      gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, particles.length);
      animationFrame = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (sizeBuffer) gl.deleteBuffer(sizeBuffer);
      if (alphaBuffer) gl.deleteBuffer(alphaBuffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas aria-hidden="true" className="ripple-field" ref={canvasRef} />;
}
