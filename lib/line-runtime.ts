import type { NormalizedPoint } from "@/lib/visual-shapes";

let activeLineSamples: NormalizedPoint[] = [];

export function setActiveLineSamples(samples: NormalizedPoint[]) {
  activeLineSamples = samples;
}

export function getActiveLineSamples() {
  return activeLineSamples;
}
