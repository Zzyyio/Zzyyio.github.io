"use client";

import { useEffect, useRef } from "react";
import { setActiveLineSamples } from "@/lib/line-runtime";
import {
  type NormalizedPoint,
  type PortfolioRoute,
  extendLineEnds,
  pointsToSmoothPath,
  sampleSmoothCurve,
  shapeForScroll,
} from "@/lib/visual-shapes";

type LineFieldProps = {
  route: PortfolioRoute;
};

function copyPoints(points: NormalizedPoint[]): NormalizedPoint[] {
  return points.map((point) => ({ ...point }));
}

export function LineField({ route }: LineFieldProps) {
  const initialShape = shapeForScroll(route, 0);
  const currentRef = useRef<NormalizedPoint[]>(copyPoints(initialShape));
  const echoRef = useRef<NormalizedPoint[]>(copyPoints(initialShape));
  const primaryPathRef = useRef<SVGPathElement>(null);
  const echoPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    let frame = 0;
    let previousTime = 0;
    let scrollProgress = 0;
    let sectionIndex = 0;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main > section, main > .project-list > article",
      ),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const readScroll = () => {
      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      scrollProgress = window.scrollY / scrollable;

      const viewportCenter = window.scrollY + window.innerHeight * 0.5;
      let nextSectionIndex = 0;
      for (let index = 1; index < sections.length; index += 1) {
        if (viewportCenter >= sections[index].offsetTop) {
          nextSectionIndex = index;
        } else {
          break;
        }
      }
      sectionIndex = nextSectionIndex;
    };

    readScroll();

    const animate = (time: number) => {
      const delta = previousTime === 0 ? 16 : Math.min(48, time - previousTime);
      previousTime = time;
      const target = shapeForScroll(route, scrollProgress, sectionIndex);
      const echoEasing = reduceMotion ? 1 : 1 - Math.exp(-delta / 440);

      currentRef.current = extendLineEnds(
        currentRef.current.map((point, index, points) => {
          const next = target[index];
          const position = index / Math.max(1, points.length - 1);
          const edgeInfluence = Math.abs(position - 0.5) * 2;
          const responseTime = 150 + (1 - edgeInfluence) * 120;
          const pointEasing = reduceMotion
            ? 1
            : 1 - Math.exp(-delta / responseTime);
          return {
            x: point.x + (next.x - point.x) * pointEasing,
            y: point.y + (next.y - point.y) * pointEasing,
          };
        }),
      );

      echoRef.current = extendLineEnds(
        echoRef.current.map((point, index) => {
          const next = currentRef.current[index];
          return {
            x: point.x + (next.x - point.x) * echoEasing,
            y: point.y + (next.y - point.y) * echoEasing,
          };
        }),
      );

      primaryPathRef.current?.setAttribute(
        "d",
        pointsToSmoothPath(currentRef.current),
      );
      echoPathRef.current?.setAttribute(
        "d",
        pointsToSmoothPath(echoRef.current),
      );
      setActiveLineSamples(sampleSmoothCurve(currentRef.current, 12));
      frame = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
    };
  }, [route]);

  return (
    <svg
      aria-hidden="true"
      className="line-field"
      preserveAspectRatio="none"
      viewBox="0 0 1000 1000"
    >
      <path
        className="line-field__echo"
        d={pointsToSmoothPath(initialShape)}
        ref={echoPathRef}
      />
      <path
        className="line-field__primary"
        d={pointsToSmoothPath(initialShape)}
        ref={primaryPathRef}
      />
    </svg>
  );
}
