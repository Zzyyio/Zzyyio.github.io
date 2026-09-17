# AGENTS.md

## Project intent

Build and maintain a restrained monochrome portfolio for an independent designer and photographer. The site has three long-form routes: introduction, photography, and projects. A persistent black line changes shape between routes and continuously reacts to vertical scroll. Pointer movement creates WebGL ripple filaments that move to both sides of the pointer path, are attracted toward the background line, fit its curve, and dissolve into it.

Before changing product code, read:

1. `docs/ART_DIRECTION.md`
2. `docs/ARCHITECTURE.md`
3. `docs/PHASES.md`
4. The relevant file under `prompts/`

## Product invariants

- Keep these routes working as direct links: `/`, `/photography`, `/projects`.
- Each route must contain multiple substantial sections and extend beyond one viewport.
- Navigation, titles, copy, images, and project links remain semantic DOM content. Never draw essential text inside Canvas or SVG.
- The persistent visual layer consists of an SVG background line plus a transparent WebGL ripple canvas.
- The background line must visibly change shape when the route changes and while the page scrolls vertically; its top, middle, and bottom states should be distinguishable at a glance.
- When the viewport center crosses a semantic section boundary, trigger a self-completing line-composition animation. Do not derive its in-between state from scroll position or alter native scrolling.
- Build section changes by moving the two off-screen endpoint anchors and propagating their displacement through the intermediate control points. Do not mirror or reverse the complete path.
- Every settled section composition must keep the visible body of the line near the central region of the viewport. Endpoints may travel along the outer boundary, but they must not pull the curve into an edge-only composition.
- Render and sample the line with the same continuous quadratic spline. Avoid cubic overshoot, sharp joins, hooks, and mismatches between the SVG curve and ripple attraction samples.
- Both ends of the background line must remain beyond the viewport with an overscan margin. No endpoint may become visible during initial render, scrolling, route interpolation, or responsive resizing.
- On fine pointers, ripple filaments are generated whenever the pointer moves; no press is required. They originate on both sides of the movement direction, disperse, bend toward the current sampled background curve, align with it, and disappear as they merge.
- Preserve complete navigation and readable content when WebGL is unavailable.
- Do not introduce a dark full-page theme, bright accent colors, glassmorphism, 3D objects, heavy shadows, or generic card grids.

## Art direction

- Palette: warm white, pale gray, charcoal, and black only.
- Typography: large editorial sans serif with compact metadata and generous leading.
- Layout: asymmetric Swiss-influenced grids, long pauses, large negative space, hairline rules.
- Motion: controlled, quiet, slightly elastic. Route transitions should feel continuous rather than abrupt.
- Photography remains true grayscale. Do not colorize images on hover.
- Corners should generally be square. Curves belong to the background path, its line-filament feedback, and rare line-created enclosures.

## Architecture boundaries

- `app/`: routes, metadata, and semantic page content.
- `components/portfolio-frame.tsx`: persistent navigation and visual layers.
- `components/line-field.tsx`: route- and scroll-driven line interpolation.
- `components/ripple-field.tsx`: WebGL setup, filament simulation, and drawing only.
- `lib/visual-shapes.ts`: route names, normalized control points, scroll deformation, and curve sampling.
- `lib/line-runtime.ts`: lightweight mutable bridge exposing the currently rendered curve samples to WebGL.
- `public/photos/`: final local photography assets.
- `docs/`: durable product and implementation decisions.
- `prompts/`: phase prompts for future agent runs.

Keep page content separate from visual simulation. Do not move content data into shaders, and do not couple the WebGL animation loop to React state updates every frame.

## Interaction rules

- Convert pointer movement into a normalized direction vector.
- Grow one paired wake from the pointer head by appending nodes along the travelled path; never instantiate a complete curve in one frame.
- Let older wake nodes drift outward along the perpendicular normal so the pair opens like a restrained boat wake.
- Clamp density and velocity so fast pointer movement does not create an unbounded filament count.
- Preserve ordered targets along densely sampled line points so each filament progressively fits the active curve instead of collapsing into one point.
- Increase absorption when a filament nears the line by reducing alpha.
- Use frame-time-based updates and clamp long frame gaps.
- Limit device pixel ratio to 1.5 unless profiling proves a higher value is safe.
- Respect `prefers-reduced-motion`; disable continuous ripple emission and line echo in that mode.
- Touch input should create intentional feedback without blocking native vertical scrolling.

## Content rules

- Visible copy is Chinese unless a short English metadata label improves the editorial system.
- Avoid filler, lorem ipsum, marketing clichés, and interface text that describes the interface.
- Keep example identity and contact values easy to find and replace.
- Every image requires useful Chinese alt text.
- Project links must look and behave like links, including keyboard focus states.

## Responsive and accessibility rules

- Support desktop, tablet, and mobile without horizontal overflow.
- Main body text should be at least 16px. Repeated navigation labels should remain at least 14px when space permits.
- Preserve visible focus indicators and a skip link.
- Check the site at 200% text zoom.
- Reduced-motion and WebGL-fallback experiences must retain the full information architecture.

## Working method

- Treat the user's latest instruction as the source of truth.
- Make the smallest coherent change that completes the active phase.
- Do not add routes, forms, filters, CMS integrations, tracking, or production dependencies unless the active phase requires them.
- Do not replace existing photography assets without explicit authorization.
- Preserve unrelated user changes.
- Use `apply_patch` for hand-authored file edits.

## Verification

Run checks proportionate to the change:

```bash
npm run build
npm run lint
```

For visual or interaction work also verify:

- `/`, `/photography`, and `/projects` load directly.
- Nav links update the active underline.
- Each route has more than one viewport of content.
- Scrolling continuously deforms and vertically drifts the background line.
- The background line crosses the viewport boundary at both ends; no cap or endpoint is visible on screen during route and scroll motion.
- Pointer hover movement progressively draws a minimal paired wake from its head; released wakes converge, align, and merge with the line.
- Native scrolling still works on touch-sized viewports.
- Reduced-motion mode removes continuous movement.

Do not declare a phase complete when its acceptance criteria in `docs/PHASES.md` are unmet.

## Code review rules

- Flag any essential text rendered only inside a canvas.
- Flag unbounded animation allocations, per-frame React state updates, missing WebGL cleanup, or device pixel ratio above the documented cap.
- Flag route content collapsed back to a single hero screen.
- Flag motion that ignores reduced-motion preferences.
- Flag visual drift outside the monochrome art direction.
