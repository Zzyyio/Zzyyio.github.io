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

type FilamentNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetOffset: number;
};

type RippleFilament = {
  nodes: FilamentNode[];
  side: -1 | 1;
  targetIndex: number;
  age: number;
  life: number;
  alpha: number;
  released: boolean;
};

const vertexShaderSource = `#version 300 es
  in vec2 a_position;
  in float a_alpha;
  uniform vec2 u_resolution;
  out float v_alpha;

  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    v_alpha = a_alpha;
  }
`;

const fragmentShaderSource = `#version 300 es
  precision highp float;
  in float v_alpha;
  out vec4 outColor;

  void main() {
    outColor = vec4(0.035, 0.035, 0.035, v_alpha);
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

function nearestSampleIndex(
  x: number,
  y: number,
  samples: NormalizedPoint[],
  width: number,
  height: number,
) {
  let nearestIndex = 0;
  let minimumDistance = Number.POSITIVE_INFINITY;

  samples.forEach((sample, index) => {
    const distance = (x - sample.x * width) ** 2 + (y - sample.y * height) ** 2;
    if (distance < minimumDistance) {
      minimumDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
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
    const alphaBuffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const alphaLocation = gl.getAttribLocation(program, "a_alpha");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const filaments: RippleFilament[] = [];
    let activePair: RippleFilament[] = [];
    const pointer = {
      initialized: false,
      down: false,
      x: 0,
      y: 0,
      lastEmitX: 0,
      lastEmitY: 0,
      directionX: 1,
      directionY: 0,
      lastAppendTime: 0,
    };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let animationFrame = 0;
    let previousTime = performance.now();
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
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const trimReleasedFilaments = () => {
      while (filaments.length > 12) {
        const oldestReleased = filaments.findIndex(
          (filament) => filament.released,
        );
        if (oldestReleased < 0) break;
        filaments.splice(oldestReleased, 1);
      }
    };

    const beginWakePair = (
      x: number,
      y: number,
      tangentX: number,
      tangentY: number,
    ) => {
      if (reduceMotion) return;
      const normalX = -tangentY;
      const normalY = tangentX;

      activePair = ([-1, 1] as const).map((side) => {
        const filament: RippleFilament = {
          nodes: [
            {
              x: x + normalX * side * 1.5,
              y: y + normalY * side * 1.5,
              vx: normalX * side * 0.72,
              vy: normalY * side * 0.72,
              targetOffset: 0,
            },
          ],
          side,
          targetIndex: 0,
          age: 0,
          life: 1.65,
          alpha: 0.16,
          released: false,
        };
        filaments.push(filament);
        return filament;
      });

      trimReleasedFilaments();
    };

    const releaseActivePair = (tangentX: number, tangentY: number) => {
      if (activePair.length === 0) return;
      const samples = lineSamples();

      activePair.forEach((filament) => {
        if (filament.nodes.length < 2) {
          const index = filaments.indexOf(filament);
          if (index >= 0) filaments.splice(index, 1);
          return;
        }

        const center = filament.nodes.reduce(
          (result, node) => ({
            x: result.x + node.x / filament.nodes.length,
            y: result.y + node.y / filament.nodes.length,
          }),
          { x: 0, y: 0 },
        );
        const nearestIndex = nearestSampleIndex(
          center.x,
          center.y,
          samples,
          width,
          height,
        );
        const before = samples[Math.max(0, nearestIndex - 2)];
        const after = samples[Math.min(samples.length - 1, nearestIndex + 2)];
        const lineDirectionX = (after.x - before.x) * width;
        const lineDirectionY = (after.y - before.y) * height;
        const targetDirection =
          lineDirectionX * tangentX + lineDirectionY * tangentY >= 0 ? 1 : -1;
        const midpoint = (filament.nodes.length - 1) / 2;

        filament.nodes.forEach((node, index) => {
          node.targetOffset = Math.round(
            (index - midpoint) * 1.55 * targetDirection,
          );
        });
        filament.targetIndex = nearestIndex;
        filament.age = 0;
        filament.life = 1.55;
        filament.released = true;
      });

      activePair = [];
      trimReleasedFilaments();
    };

    const appendWakePoint = (
      originX: number,
      originY: number,
      x: number,
      y: number,
      tangentX: number,
      tangentY: number,
      speed: number,
    ) => {
      if (activePair.length === 0) {
        beginWakePair(originX, originY, tangentX, tangentY);
      }

      const normalX = -tangentY;
      const normalY = tangentX;
      const outwardSpeed = clamp(0.72 + speed * 0.028, 0.78, 1.35);

      activePair.forEach((filament) => {
        filament.nodes.push({
          x: x + normalX * filament.side * 1.5,
          y: y + normalY * filament.side * 1.5,
          vx: normalX * filament.side * outwardSpeed,
          vy: normalY * filament.side * outwardSpeed,
          targetOffset: 0,
        });
        filament.alpha = Math.min(0.62, 0.16 + filament.nodes.length * 0.045);
      });

      pointer.lastAppendTime = performance.now();

      if (activePair[0]?.nodes.length >= 12) {
        releaseActivePair(tangentX, tangentY);
      }
    };

    const setPointerOrigin = (event: PointerEvent) => {
      pointer.initialized = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastEmitX = event.clientX;
      pointer.lastEmitY = event.clientY;
      pointer.lastAppendTime = performance.now();
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

      if (canEmit && emitDistance >= 7) {
        const tangentX = emitDx / emitDistance;
        const tangentY = emitDy / emitDistance;
        const steps = Math.min(4, Math.max(1, Math.floor(emitDistance / 7)));
        const originX = pointer.lastEmitX;
        const originY = pointer.lastEmitY;
        let previousX = originX;
        let previousY = originY;

        pointer.directionX = tangentX;
        pointer.directionY = tangentY;

        for (let step = 1; step <= steps; step += 1) {
          const progress = step / steps;
          appendWakePoint(
            previousX,
            previousY,
            originX + emitDx * progress,
            originY + emitDy * progress,
            tangentX,
            tangentY,
            Math.hypot(dx, dy),
          );
          previousX = originX + emitDx * progress;
          previousY = originY + emitDy * progress;
        }

        pointer.lastEmitX = event.clientX;
        pointer.lastEmitY = event.clientY;
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      pointer.down = false;
      if (event.pointerType === "touch") {
        releaseActivePair(pointer.directionX, pointer.directionY);
      }
    };

    const onPointerLeave = () => {
      releaseActivePair(pointer.directionX, pointer.directionY);
      if (!pointer.down) pointer.initialized = false;
    };

    const render = (time: number) => {
      const deltaSeconds = Math.min(0.05, (time - previousTime) / 1000);
      const frameScale = deltaSeconds * 60;
      previousTime = time;

      if (
        activePair.length > 0 &&
        time - pointer.lastAppendTime > 200
      ) {
        releaseActivePair(pointer.directionX, pointer.directionY);
      }

      const samples = lineSamples();

      for (let index = filaments.length - 1; index >= 0; index -= 1) {
        const filament = filaments[index];

        if (!filament.released) {
          filament.nodes.forEach((node) => {
            const damping = Math.pow(0.966, frameScale);
            node.vx *= damping;
            node.vy *= damping;
            node.x += node.vx * frameScale;
            node.y += node.vy * frameScale;
          });
          continue;
        }

        filament.age += deltaSeconds;
        const lifeProgress = filament.age / filament.life;
        const attraction = smoothstep(0.08, 0.88, lifeProgress);
        const spring = 0.0018 + attraction * attraction * 0.019;
        let totalDistance = 0;

        filament.nodes.forEach((node) => {
          const targetIndex = clamp(
            filament.targetIndex + node.targetOffset,
            0,
            samples.length - 1,
          );
          const target = samples[targetIndex];
          const targetX = target.x * width;
          const targetY = target.y * height;
          const distanceX = targetX - node.x;
          const distanceY = targetY - node.y;
          totalDistance += Math.hypot(distanceX, distanceY);
          node.vx += distanceX * spring * frameScale;
          node.vy += distanceY * spring * frameScale;
          const damping = Math.pow(0.925 - attraction * 0.055, frameScale);
          node.vx *= damping;
          node.vy *= damping;
          node.x += node.vx * frameScale;
          node.y += node.vy * frameScale;
        });

        const averageDistance = totalDistance / filament.nodes.length;
        const fadeOut = 1 - smoothstep(0.58, 1, lifeProgress);
        const merge =
          lifeProgress < 0.54 ? 1 : clamp(averageDistance / 30, 0.06, 1);
        filament.alpha = 0.62 * fadeOut * merge;

        if (lifeProgress >= 1 || filament.alpha < 0.005) {
          filaments.splice(index, 1);
        }
      }

      const positions: number[] = [];
      const alphas: number[] = [];

      filaments.forEach((filament) => {
        const segmentCount = filament.nodes.length - 1;

        for (let nodeIndex = 0; nodeIndex < segmentCount; nodeIndex += 1) {
          const start = filament.nodes[nodeIndex];
          const end = filament.nodes[nodeIndex + 1];
          const startPosition = nodeIndex / Math.max(1, segmentCount);
          const endPosition = (nodeIndex + 1) / Math.max(1, segmentCount);
          const startTaper = filament.released
            ? 0.26 + Math.sin(startPosition * Math.PI) * 0.74
            : 0.28 + startPosition * 0.72;
          const endTaper = filament.released
            ? 0.26 + Math.sin(endPosition * Math.PI) * 0.74
            : 0.28 + endPosition * 0.72;

          positions.push(
            start.x * pixelRatio,
            start.y * pixelRatio,
            end.x * pixelRatio,
            end.y * pixelRatio,
          );
          alphas.push(
            filament.alpha * startTaper,
            filament.alpha * endTaper,
          );
        }
      });

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.lineWidth(Math.min(2, pixelRatio * 1.1));

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.DYNAMIC_DRAW,
      );
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(alphaLocation);
      gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, alphas.length);
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
      if (alphaBuffer) gl.deleteBuffer(alphaBuffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas aria-hidden="true" className="ripple-field" ref={canvasRef} />;
}
