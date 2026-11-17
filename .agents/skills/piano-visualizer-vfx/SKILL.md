---
name: piano-visualizer-vfx
description: Use when building, debugging, or styling piano roll visualizers, falling keys, note particle systems, volumetric beam lights, and keyboard geometry for web applications.
---

# Piano Visualizer VFX & Falling Keys Architecture

Proven patterns, geometry tokens, and rendering pipelines for building high-performance, studio-grade piano waterfall visualizers inspired by Piano-VFX, Synthesia, and SeeMusic.

---

## 1. Core Principles

1. **Never Compress the Keyboard**:
   - Piano keys have strict physical proportions. Never stretch or squish an 88-key keyboard with `preserveAspectRatio="none"`.
   - Maintain an authentic 5.5:1 to 6.5:1 aspect ratio on white keys (e.g. 20px wide × 110–120px tall) and 3:5 height on black keys.
   - Decouple the falling note canvas track from the physical keybed: the canvas fills the vertical viewport height while the keybed sits firmly at the bottom with fixed geometric proportions.

2. **Dual-Pass Additive Light Composition**:
   - Render note ribbons and key structures on a primary layer.
   - Render volumetric light beams and particle bursts on a separate top layer using Canvas 2D `globalCompositeOperation = 'lighter'` (or WebGL additive blending). This produces incandescent, photo-realistic neon glow without expensive per-frame CSS `filter: blur()`.

3. **Separation of Hand Roles**:
   - **Left Hand (LH / Bass Clef)**: Neon Rose (`#EC4899`, `rgba(236, 72, 153, ...)`).
   - **Right Hand (RH / Treble Clef)**: Electric Gold (`#FACC15` / `#F59E0B`, `rgba(250, 204, 21, ...)`).
   - Chord voicings and melody notes must carry explicit hand tags to preserve visual clarity for the practicing musician.

4. **Dual-Theme Studio Housing**:
   - In Dark Mode: Seamless deep Obsidian stage (`#09090B`).
   - In Light Mode: An authentic acoustic grand piano lacquer housing with warm stone hairpins (`#E4E4E0`) and recessed stage shading that sits naturally inside Studio Alabaster (`#F8F8F6`) without creating a jarring floating black box.

---

## 2. Geometry & Key Coordinates

Standard 88-Key Concert Grand (A0 = MIDI 21 to C8 = MIDI 108):
- **52 White Keys**: Width $W_w = 20\text{px}$, Height $H_w = 110\text{px}$–$120\text{px}$. Total width = $1040\text{px}$.
- **36 Black Keys**: Width $W_b = 12\text{px}$ (60% of white), Height $H_b = 72\text{px}$ (65% of white).
- **Strike Line**: Located $4\text{px}$–$8\text{px}$ above the top edge of the keybed.

```typescript
export const START_MIDI = 21 // A0
export const END_MIDI = 108   // C8
export const WHITE_NOTE_OCTAVE_SET = new Set([0, 2, 4, 5, 7, 9, 11])

// Accurate key coordinate generator
export function buildPianoKeyMap(whiteKeyWidth = 20, blackKeyWidth = 12) {
  const keys: Array<{ midi: number; isWhite: boolean; x: number; width: number; name: string }> = []
  let whiteCount = 0

  // Pass 1: White keys
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    if (WHITE_NOTE_OCTAVE_SET.has(midi % 12)) {
      keys.push({
        midi,
        isWhite: true,
        x: whiteCount * whiteKeyWidth,
        width: whiteKeyWidth,
        name: midiToPitchName(midi),
      })
      whiteCount++
    }
  }

  // Pass 2: Black keys (centered on white key barlines)
  whiteCount = 0
  for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
    if (!WHITE_NOTE_OCTAVE_SET.has(midi % 12)) {
      keys.push({
        midi,
        isWhite: false,
        x: whiteCount * whiteKeyWidth - blackKeyWidth / 2,
        width: blackKeyWidth,
        name: midiToPitchName(midi),
      })
    } else {
      whiteCount++
    }
  }
  return keys
}
```

---

## 3. Light Beams & Volumetric Cones

When a note reaches the strike line, render three distinct lighting elements:

1. **Downward Key Spotlight (Illuminating the Physical Key)**:
   - A linear gradient extending from the strike line down to the key bottom.
   - Starts with a high-intensity white flash at the strike point ($y = \text{strikeY}$), fading into the hand color ($0.65$ opacity) and dispersing onto the key surface.

2. **Skyward Volumetric Column**:
   - A tapered vertical trapezoid extending from the strike line upward into the falling note channel.
   - Width expands subtly ($1.2\times$ key width) with a vertical linear gradient fading to zero opacity at $y = 0$.

3. **Laser Strike Lens Flare**:
   - A radial gradient centered at $(x_{\text{key}}, y_{\text{strike}})$:
   ```typescript
   const flare = ctx.createRadialGradient(cx, strikeY, 1, cx, strikeY, 28)
   flare.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
   flare.addColorStop(0.25, `rgba(${baseColorRgb}, 0.85)`)
   flare.addColorStop(0.65, `rgba(${baseColorRgb}, 0.2)`)
   flare.addColorStop(1, 'rgba(0, 0, 0, 0)')
   ctx.fillStyle = flare
   ctx.beginPath()
   ctx.arc(cx, strikeY, 28, 0, Math.PI * 2)
   ctx.fill()
   ```

---

## 4. Particle Fountain & Spark Dynamics

To create natural glitter and stardust sparks without lag:
- Use an object pool of $\le 350$ particles.
- Update velocity with mild gravity ($v_y += 0.08$) and air drag ($v_x \times= 0.985$).
- Modulate alpha with a sinusoidal twinkle factor ($\sin(\text{life} \times \text{twinkle})$).
- Render circles with small radii ($0.8\text{px}$–$2.4\text{px}$) and additive `shadowBlur`.

```typescript
interface SparkParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  color: string
  twinkle: number
  wobble: number
}

// Particle lifecycle update
particles.forEach((p) => {
  p.x += p.vx + Math.sin(p.life * p.wobble) * 0.3
  p.y += p.vy
  p.vy += 0.08  // gravity
  p.vx *= 0.985 // drag
  p.life -= 1 / p.maxLife
})
```

---

## 5. Falling Note Capsules

- **Capsule Anatomy**:
  - Border: $2\text{px}$ solid neon stroke (`#EC4899` or `#FACC15`).
  - Interior: Semi-translucent dark gradient (`rgba(20, 20, 25, 0.75)` to `rgba(40, 25, 45, 0.85)`).
  - Corner Radius: $6\text{px}$–$8\text{px}$ rounded caps.
  - Typography: Centered monospace pitch label (e.g. `C4`, `G#3`) in white or light gold with a subtle drop shadow.

---

## 6. Integration Checklist

- [ ] Canvas uses `devicePixelRatio` scaling clamped to 2 for crisp Retina displays without memory bloat.
- [ ] Animation loop uses `requestAnimationFrame` and cleans up on unmount.
- [ ] Laser strike line renders as a continuous glowing gradient across all 88 keys.
- [ ] Active key depressions trigger visual key movement ($+2\text{px}$ downward offset on pressed keys).
- [ ] Audio note plucking triggers synchronous particle burst at $(x_{\text{key}}, y_{\text{strike}})$.
