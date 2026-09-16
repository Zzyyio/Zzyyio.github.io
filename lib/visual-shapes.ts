export type PortfolioRoute = "intro" | "photography" | "projects";

export type NormalizedPoint = {
  x: number;
  y: number;
};

const intro: NormalizedPoint[] = [
  { x: -0.08, y: 0.2 },
  { x: 0.08, y: 0.29 },
  { x: 0.23, y: 0.26 },
  { x: 0.4, y: 0.12 },
  { x: 0.61, y: 0.08 },
  { x: 0.76, y: 0.19 },
  { x: 0.82, y: 0.42 },
  { x: 0.96, y: 0.52 },
  { x: 1.03, y: 0.73 },
  { x: 0.88, y: 0.89 },
  { x: 0.63, y: 0.83 },
  { x: 0.43, y: 0.87 },
];

const photography: NormalizedPoint[] = [
  { x: -0.08, y: 0.1 },
  { x: 0.1, y: 0.18 },
  { x: 0.26, y: 0.12 },
  { x: 0.45, y: 0.08 },
  { x: 0.54, y: 0.25 },
  { x: 0.5, y: 0.45 },
  { x: 0.65, y: 0.5 },
  { x: 0.8, y: 0.42 },
  { x: 1.03, y: 0.58 },
  { x: 0.93, y: 0.82 },
  { x: 0.7, y: 0.79 },
  { x: 0.45, y: 0.88 },
];

const projects: NormalizedPoint[] = [
  { x: -0.08, y: 0.08 },
  { x: 0.08, y: 0.1 },
  { x: 0.26, y: 0.18 },
  { x: 0.31, y: 0.36 },
  { x: 0.46, y: 0.36 },
  { x: 0.64, y: 0.36 },
  { x: 0.58, y: 0.63 },
  { x: 0.73, y: 0.56 },
  { x: 0.9, y: 0.43 },
  { x: 1.03, y: 0.52 },
  { x: 0.93, y: 0.78 },
  { x: 0.75, y: 0.88 },
];

export const routeShapes: Record<PortfolioRoute, NormalizedPoint[]> = {
  intro,
  photography,
  projects,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function extendEndpointOutside(
  point: NormalizedPoint,
  neighbor: NormalizedPoint,
  margin: number,
): NormalizedPoint {
  if (
    point.x <= -margin ||
    point.x >= 1 + margin ||
    point.y <= -margin ||
    point.y >= 1 + margin
  ) {
    return { ...point };
  }

  const directionX = point.x - neighbor.x;
  const directionY = point.y - neighbor.y;
  const candidates: number[] = [];

  if (directionX < -0.0001) {
    candidates.push((-margin - point.x) / directionX);
  } else if (directionX > 0.0001) {
    candidates.push((1 + margin - point.x) / directionX);
  }

  if (directionY < -0.0001) {
    candidates.push((-margin - point.y) / directionY);
  } else if (directionY > 0.0001) {
    candidates.push((1 + margin - point.y) / directionY);
  }

  const distance = Math.min(
    ...candidates.filter((candidate) => candidate >= 0),
  );

  if (!Number.isFinite(distance)) {
    return {
      x: point.x < 0.5 ? -margin : 1 + margin,
      y: point.y,
    };
  }

  return {
    x: point.x + directionX * distance,
    y: point.y + directionY * distance,
  };
}

export function extendLineEnds(
  points: NormalizedPoint[],
  margin = 0.16,
): NormalizedPoint[] {
  if (points.length < 2) return points.map((point) => ({ ...point }));

  const extended = points.map((point) => ({ ...point }));
  extended[0] = extendEndpointOutside(points[0], points[1], margin);
  extended[extended.length - 1] = extendEndpointOutside(
    points[points.length - 1],
    points[points.length - 2],
    margin,
  );
  return extended;
}

export function shapeForScroll(
  route: PortfolioRoute,
  progress: number,
): NormalizedPoint[] {
  const scroll = clamp(progress, 0, 1);
  const drift = scroll * 0.27;
  const bend = Math.sin(scroll * Math.PI);
  const pulse = Math.sin(scroll * Math.PI * 2);

  const deformed = routeShapes[route].map((point, index, points) => {
    const position = index / Math.max(1, points.length - 1);
    const envelope = Math.sin(position * Math.PI);
    const wave = Math.sin(index * 0.84 + scroll * Math.PI * 2.1);
    const counterWave = Math.cos(index * 0.62 + scroll * Math.PI * 1.55);

    return {
      x:
        point.x +
        wave * envelope * bend * 0.065 +
        (scroll - 0.5) * (point.y - 0.5) * 0.085 +
        pulse * envelope * 0.018,
      y:
        point.y -
        drift +
        counterWave * envelope * bend * 0.052 +
        pulse * (position - 0.5) * 0.035,
    };
  });

  return extendLineEnds(deformed);
}

export function routeFromPathname(pathname: string): PortfolioRoute {
  if (pathname.startsWith("/photography")) return "photography";
  if (pathname.startsWith("/projects")) return "projects";
  return "intro";
}

export function pointsToSmoothPath(points: NormalizedPoint[]): string {
  if (points.length < 2) return "";

  const scaled = points.map((point) => ({
    x: point.x * 1000,
    y: point.y * 1000,
  }));

  let path = `M ${scaled[0].x.toFixed(2)} ${scaled[0].y.toFixed(2)}`;

  for (let index = 0; index < scaled.length - 1; index += 1) {
    const previous = scaled[Math.max(0, index - 1)];
    const current = scaled[index];
    const next = scaled[index + 1];
    const after = scaled[Math.min(scaled.length - 1, index + 2)];
    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const control2 = {
      x: next.x - (after.x - current.x) / 6,
      y: next.y - (after.y - current.y) / 6,
    };

    path += ` C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)}, ${control2.x.toFixed(2)} ${control2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

export function sampleSmoothCurve(
  points: NormalizedPoint[],
  samplesPerSegment = 10,
): NormalizedPoint[] {
  if (points.length < 2) return points.map((point) => ({ ...point }));

  const samples: NormalizedPoint[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];

    for (let sample = 0; sample < samplesPerSegment; sample += 1) {
      const time = sample / samplesPerSegment;
      const time2 = time * time;
      const time3 = time2 * time;

      samples.push({
        x:
          0.5 *
          (2 * current.x +
            (-previous.x + next.x) * time +
            (2 * previous.x - 5 * current.x + 4 * next.x - after.x) *
              time2 +
            (-previous.x + 3 * current.x - 3 * next.x + after.x) * time3),
        y:
          0.5 *
          (2 * current.y +
            (-previous.y + next.y) * time +
            (2 * previous.y - 5 * current.y + 4 * next.y - after.y) *
              time2 +
            (-previous.y + 3 * current.y - 3 * next.y + after.y) * time3),
      });
    }
  }

  samples.push({ ...points[points.length - 1] });
  return samples;
}
