---
name: better-ui
description: Polishes surfaces, icons, and motion with exact values for border radius, optical alignment, shadows, press feedback, and transition hygiene.
---

# Better UI Polish

Polishes visual craft across interactive components, surfaces, tactile feedback, and transitions.

## Exact Values & Principles

1. **Concentric Border Radius**:
   - `outer_radius = inner_radius + padding + border_width`.
   - Never nest identical rounded corners inside padded containers.

2. **Press Feedback & Scale**:
   - Tactile buttons scale to `0.96` on active press (`active:scale-[0.96]`) over `150ms ease-out`.
   - Disabled buttons must never scale (`enabled:active:scale-[0.96]`).

3. **Transitions & Animations**:
   - Use CSS transitions or spring motion for state changes that reverse on hover/press.
   - Name explicit properties (`transition-property: opacity, transform, background-color`), never blanket `transition-all`.
   - Gate all animations behind reduced-motion guards (`useReducedMotion` or `motion-safe:`).

4. **Shadows & Borders**:
   - Shadows for elevation, crisp borders for structural definition.
   - On dark themes, use subtle borders (`border-[#38342E]`) and soft atmospheric ambient glows rather than muddy black drop-shadows.

5. **Scroll Containment**:
   - Add `overscroll-behavior: contain` on scrollable overlays, drawers, and modal sheets so scrolling the sheet does not bleed into the page behind.

6. **Optical Alignment**:
   - Icon nudges: optical center differs from geometric bounding box. Provide 1–2px adjustments for play arrows and chevrons.
