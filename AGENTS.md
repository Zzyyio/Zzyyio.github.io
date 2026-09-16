# AGENTS.md

## Project intent

Build and maintain a restrained monochrome portfolio for an independent designer and photographer. The site has three long-form routes: introduction, photography, and projects. A persistent black line changes shape between routes and continuously reacts to vertical scroll. On the `dot` branch, pointer movement creates WebGL dot ripples that disperse around both sides of the path, are attracted toward the background line, and dissolve into it.

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
- Both ends of the background line must remain beyond the viewport with an overscan margin. No endpoint may become visible during initial render, scrolling, route interpolation, or responsive resizing.
- On fine pointers, dot ripples are generated whenever the pointer moves; no press is required. They begin as a restrained wake around both sides of the movement direction, disperse, curve toward the current sampled background line, and disappear as they merge.
- Preserve complete navigation and readable content when WebGL is unavailable.
- Do not introduce a dark full-page theme, bright accent colors, glassmorphism, 3D objects, heavy shadows, or generic card grids.

## Art direction

- Palette: warm white, pale gray, charcoal, and black only.
- Typography: large editorial sans serif with compact metadata and generous leading.
- Layout: asymmetric Swiss-influenced grids, long pauses, large negative space, hairline rules.
- Motion: controlled, quiet, slightly elastic. Route transitions should feel continuous rather than abrupt.
- Photography remains true grayscale. Do not colorize images on hover.
- Corners should generally be square. Curves belong to the background path and rare line-created enclosures; ripple feedback on this branch is made of small round dots.

## Architecture boundaries

- `app/`: routes, metadata, and semantic page content.
- `components/portfolio-frame.tsx`: persistent navigation and visual layers.
- `components/line-field.tsx`: route- and scroll-driven line interpolation.
- `components/ripple-field.tsx`: WebGL setup, dot-particle simulation, and drawing only.
- `lib/visual-shapes.ts`: route names, normalized control points, scroll deformation, and curve sampling.
- `lib/line-runtime.ts`: lightweight mutable bridge exposing the currently rendered curve samples to WebGL.
- `public/photos/`: final local photography assets.
- `docs/`: durable product and implementation decisions.
- `prompts/`: phase prompts for future agent runs.

Keep page content separate from visual simulation. Do not move content data into shaders, and do not couple the WebGL animation loop to React state updates every frame.

## Interaction rules

- Convert pointer movement into a normalized direction vector.
- Emit a small, balanced group of dots on both sides of the pointer path using the perpendicular normal vector.
- Give new dots a brief outward velocity so the cluster opens like restrained boat-wake spray before attraction becomes dominant.
- Clamp density and velocity so fast pointer movement does not create an unbounded particle count.
- Attract each dot to the nearest point on the densely sampled active background line.
- Increase absorption when a dot nears the line by reducing both size and alpha.
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
- Pointer hover movement produces a minimal dot wake that first disperses, then curves toward and disappears into the line.
- Native scrolling still works on touch-sized viewports.
- Reduced-motion mode removes continuous movement.

Do not declare a phase complete when its acceptance criteria in `docs/PHASES.md` are unmet.

## Code review rules

- Flag any essential text rendered only inside a canvas.
- Flag unbounded animation allocations, per-frame React state updates, missing WebGL cleanup, or device pixel ratio above the documented cap.
- Flag route content collapsed back to a single hero screen.
- Flag motion that ignores reduced-motion preferences.
- Flag visual drift outside the monochrome art direction.
