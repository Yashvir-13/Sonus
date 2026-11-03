---
name: better-typography
description: Sets and reviews how text renders, from type scale and unitless line-height to letter-spacing, wrapping, truncation, tabular numbers, and punctuation.
---

# Better Typography

This skill sets and reviews how text renders, from type scale and spacing to font loading, wrapping, and punctuation.

## Key Rules & Measurements

1. **Unitless Line-Height**:
   - Display text: `1.1` to `1.2`.
   - Headings: `1.2` to `1.3`.
   - Body copy: `1.5` to `1.6`.
   - Never use fixed `px` or `rem` for line-height.

2. **Letter-Spacing (Tracking) by Size**:
   - Headings at `24px` and up: `-0.01em` to `-0.03em` (tighter for display elegance).
   - Uppercase labels at `14px` or smaller: `0.05em` to `0.15em` (tracked out for readability).
   - Body copy: `0` to `-0.005em`.
   - Always specify letter-spacing in `em` so it scales proportionally.

3. **Weight Restraint**:
   - Below `18px`, use weight `400` or heavier. Avoid `font-thin` or `font-light` on small text.
   - For display serifs (Cormorant Garamond), use `font-light` (`300`) or `font-normal` (`400`) at massive sizes (`text-6xl+`), avoiding muddy `font-black`.

4. **Tabular Numbers**:
   - On changing metrics, BPM counters, cents deviation, timer stamps, and frets, always apply `font-variant-numeric: tabular-nums` (Tailwind `tabular-nums`).

5. **Line Length & Measure**:
   - Cap long-form editorial copy at 60–75 characters per line (`max-w-prose` or `max-w-2xl`).
   - Use `text-wrap: balance` on headings and short titles; never on long paragraphs (use `text-wrap: pretty`).

6. **Smart Punctuation & Typography Glyphs**:
   - Use `…` (horizontal ellipsis), `—` (em dash), `–` (en dash), and `§` (section sign).
   - Never use raw `--` or triple dots `...` in rendered display strings.
