# Stitch MCP Specification Mining Report: Milestone 1 Tool Contracts

**Spec Miner**: Spec Miner M1-3  
**Working Directory**: `d:\Projects\adaptive-music-practice\.agents\teamwork\explorer_m1_3\`  
**Date**: 2026-10-06  
**Status**: Complete  
**Authoritative Source**: JSON Schema definitions in `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\` (15 tools)  

---

## 1. Executive Summary

This report establishes the authoritative specification for all Google Stitch MCP tools required for **Milestone 1** of the Sonus Adaptive Musical Practice System, based directly on the authoritative JSON schemas located at `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\`.

### Key Verification Findings:
1. **Core 4 Assigned Tools Verified**:
   - `create_project`: Requires optional `title` (`string`). Returns project resource `projects/{project_id}`.
   - `create_design_system`: Requires `designSystem` (`object`) with `displayName` (`string`) and `theme` (`object`). Theme requires `colorMode` (enum), `headlineFont` (enum), `bodyFont` (enum), `roundness` (enum), and `customColor` (hex `string`).
   - `generate_screen_from_text`: Requires `projectId` (`string`, without `projects/` prefix) and `prompt` (`string`). Accepts optional `designSystem` (`string`, format: `assets/{asset_id}`), `deviceType` (enum: `DESKTOP`), and `modelId` (enum: `GEMINI_3_8_FLASH`).
   - `get_screen`: Requires `name` (`string`, format: `projects/{project}/screens/{screen}`).
2. **Schema Instruction Alert for Design System**:
   - The authoritative schema for `create_design_system` states:  
     `"Call update_design_system tool immediately after this tool to apply the design system to the project, and display the design system in the UI."`  
     Explorer 3 omitted this intermediate step; the Worker must either call `update_design_system` or pass the resulting `assets/{asset_id}` into `generate_screen_from_text`.
3. **Prefix & Identifier Discipline**:
   - `projectId`: Naked string without `projects/` prefix across `create_design_system`, `generate_screen_from_text`, `list_screens`, `upload_design_md`, `apply_design_system`, `edit_screens`, and `generate_variants`.
   - `name`: Full resource path with `projects/{project}` for `get_project`/`delete_project`, and `projects/{project}/screens/{screen}` for `get_screen`.
   - `designSystem`: Full resource path with `assets/{asset_id}` in `generate_screen_from_text` and `update_design_system`.
   - `assetId`: Naked ID without `assets/` prefix in `apply_design_system`.
   - `selectedScreenIds`: Naked screen IDs without `screens/` prefix in `edit_screens` and `generate_variants`.
4. **Enums & Styling Constraints**:
   - No `ROUND_ZERO` enum exists in Stitch MCP. The minimum valid corner roundness enum is `ROUND_FOUR`. Sharp 0-radius borders (`--radius: 0`) must therefore be reinforced via the `designMd` parameter and descriptive prompt text.
   - Font enums: Stitch MCP supports 68 font families. `PLAYFAIR_DISPLAY`, `NEWSREADER`, `INTER`, `JETBRAINS_MONO`, and `GEIST` are all authoritative enum values.

---

## 2. Features Discovered

The table below catalogs all features and tools discovered across the Stitch MCP specification suite:

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Project Lifecycle | `create_project` | Creates a new Stitch container for UI designs and frontend code | `title` (optional `string`) | Project resource (`projects/{project_id}`) | Fails if payload not JSON object | `create_project.json` |
| 2 | Project Lifecycle | `list_projects` | Lists accessible Stitch projects (owned or shared) | `filter` (optional `string`, e.g. `view=owned`, `view=shared`) | Array of project objects | Rejects unrecognized filter syntax | `list_projects.json` |
| 3 | Project Lifecycle | `get_project` | Retrieves project metadata, screen instances, and asset bindings | `name` (required `string`, `projects/{project}`) | Detailed Project object | Fails with 404 if project not found | `get_project.json` |
| 4 | Project Lifecycle | `delete_project` | Irreversibly deletes a Stitch project resource | `name` (required `string`, `projects/{project}`) | Empty success response | Irreversible operation; fails if invalid name | `delete_project.json` |
| 5 | Design Tokens | `create_design_system` | Programmatically creates a design system with colors, fonts, roundness, and markdown | `projectId` (optional `string`), `designSystem` (required `object`) | Asset resource (`assets/{asset_id}`) | Fails if missing required theme fields (`colorMode`, `headlineFont`, `bodyFont`, `roundness`, `customColor`) | `create_design_system.json` |
| 6 | Design Tokens | `list_design_systems` | Lists existing design system assets for a project or globally | `projectId` (optional `string`) | Array of design system assets | Fails if invalid project ID format | `list_design_systems.json` |
| 7 | Design Tokens | `update_design_system` | Updates foundational tokens and applies them to project UI | `name` (required `string`, `assets/{asset_id}`), `projectId` (required `string`), `designSystem` (required `object`) | Updated design system asset | Fails if asset name or projectId mismatched | `update_design_system.json` |
| 8 | Design Tokens | `upload_design_md` | Uploads base64-encoded UTF-8 DESIGN.md to project | `projectId` (required `string`), `designMdBase64` (required `string`) | Screen instance representing DESIGN.md | Rejects non-UTF-8 base64 bytes | `upload_design_md.json` |
| 9 | Design Tokens | `create_design_system_from_design_md` | Derives design tokens from an uploaded DESIGN.md screen instance | `projectId` (required `string`), `selectedScreenInstance` (required `object`), `deviceType` (optional enum) | Derived design system asset | Fails if screen instance ID or sourceScreen invalid | `create_design_system_from_design_md.json` |
| 10 | Design Tokens | `apply_design_system` | Applies design tokens of an asset to selected screen instances | `projectId` (required `string`), `assetId` (required `string`), `selectedScreenInstances` (required array) | Updated screen instances | Fails if asset ID or screen instances not found | `apply_design_system.json` |
| 11 | Screen Generation | `generate_screen_from_text` | Generates a new screen design from text prompt and optional design system | `projectId` (required `string`), `prompt` (required `string`), `designSystem` (optional `string`), `deviceType` (optional enum), `modelId` (optional enum) | Generated screen metadata and `output_components` | Generation timeout (1–3 min); schema forbids retry, mandates polling via `get_screen` | `generate_screen_from_text.json` |
| 12 | Screen Retrieval | `list_screens` | Lists all screen instances within a project container | `projectId` (required `string`) | Array of screen metadata objects | Fails if project ID missing or malformed | `list_screens.json` |
| 13 | Screen Retrieval | `get_screen` | Retrieves screen details, code trees, layout data, and preview URLs | `name` (required `string`, `projects/{project}/screens/{screen}`) | Complete Screen object | Fails with 404 if screen resource not found | `get_screen.json` |
| 14 | Screen Modification | `edit_screens` | Natural language delta modification of existing screens | `projectId` (required `string`), `selectedScreenIds` (required array of strings), `prompt` (required `string`), `deviceType` (optional enum), `modelId` (optional enum) | Updated screen instances | Timeout/disconnect handled asynchronously | `edit_screens.json` |
| 15 | Screen Modification | `generate_variants` | Generates 1–5 variations focused on layout, colors, images, or typography | `projectId` (required `string`), `selectedScreenIds` (required array of strings), `prompt` (required `string`), `variantOptions` (required `object`), `deviceType` (optional enum), `modelId` (optional enum) | Variant screen instances | Timeout handled via `get_screen` polling | `generate_variants.json` |

---

## 3. Deep-Dive Specification of Core Assigned Tools

### 3.1 `create_project`
- **Schema File**: `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\create_project.json`
- **Purpose**: Initializes a new project workspace container.
- **Parameters**:
  - `title` (`string`, optional): Project title. Example: `"Sonus Adaptive Musical Practice - Living Manuscript"`.
- **Required Fields**: None (empty object `{}` is structurally valid).
- **Return Contract**:
  ```json
  {
    "name": "projects/4044680601076201931",
    "title": "Sonus Adaptive Musical Practice - Living Manuscript",
    "createTime": "..."
  }
  ```

---

### 3.2 `create_design_system`
- **Schema File**: `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\create_design_system.json`
- **Purpose**: Defines theme tokens, typography scales, colors, and roundness across the project.
- **Parameters**:
  - `projectId` (`string`, optional): Project ID **without** `projects/` prefix. If omitted, creates a global asset.
  - `designSystem` (`object`, **required**):
    - `displayName` (`string`, **required**): Human-readable name (e.g. `"Living Manuscript"`).
    - `theme` (`object`, **required**):
      - `colorMode` (`string`, **required**): Enum `["COLOR_MODE_UNSPECIFIED", "LIGHT", "DARK"]`.
      - `customColor` (`string`, **required**): Hex seed/primary color (e.g. `"#9A2A2A"`).
      - `headlineFont` (`string`, **required**): Enum from 68 supported font families (see §3.2.1).
      - `bodyFont` (`string`, **required**): Enum from 68 supported font families.
      - `roundness` (`string`, **required**): Enum `["ROUNDNESS_UNSPECIFIED", "ROUND_TWO", "ROUND_FOUR", "ROUND_EIGHT", "ROUND_TWELVE", "ROUND_FULL"]`. (`ROUND_TWO` is deprecated; valid supported: `ROUND_FOUR`, `ROUND_EIGHT`, `ROUND_TWELVE`, `ROUND_FULL`).
      - `labelFont` (`string`, optional): Enum from 68 supported font families (e.g. `JETBRAINS_MONO`, `SPACE_MONO`, `GEIST`).
      - `colorVariant` (`string`, optional): Enum `["COLOR_VARIANT_UNSPECIFIED", "MONOCHROME", "NEUTRAL", "TONAL_SPOT", "VIBRANT", "EXPRESSIVE", "FIDELITY", "CONTENT", "RAINBOW", "FRUIT_SALAD"]`.
      - `overrideNeutralColor` (`string`, optional): Hex string (e.g. `"#F4F1EA"`).
      - `overridePrimaryColor` (`string`, optional): Hex string (e.g. `"#9A2A2A"`).
      - `overrideSecondaryColor` (`string`, optional): Hex string (e.g. `"#2C2A29"`).
      - `overrideTertiaryColor` (`string`, optional): Hex string (e.g. `"#E9E4DA"`).
      - `designMd` (`string`, optional): Raw markdown containing complete design guidelines.
      - `spacing` (`object`, optional): Key-value map of string spacing tokens.
      - `typography` (`object`, optional): Map of level names to `Typography` objects (`fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`).
- **Required Fields**:
  - Top level: `designSystem`
  - Within `designSystem`: `displayName`, `theme`
  - Within `theme`: `colorMode`, `headlineFont`, `bodyFont`, `roundness`, `customColor`
- **Critical Schema Directive**:
  `"Call update_design_system tool immediately after this tool to apply the design system to the project, and display the design system in the UI."`

#### 3.2.1 Authoritative Font Family Enums (Complete 68 Entries)
`FONT_UNSPECIFIED`, `BE_VIETNAM_PRO`, `EPILOGUE`, `INTER`, `LEXEND`, `MANROPE`, `NEWSREADER`, `NOTO_SERIF`, `PLUS_JAKARTA_SANS`, `PUBLIC_SANS`, `SPACE_GROTESK`, `SPLINE_SANS`, `WORK_SANS`, `DOMINE`, `LIBRE_CASLON_TEXT`, `EB_GARAMOND`, `LITERATA`, `SOURCE_SERIF_4`, `SOURCE_SERIF_FOUR` *(deprecated)*, `MONTSERRAT`, `METROPHOBIC`, `METROPOLIS` *(deprecated)*, `SOURCE_SANS_3`, `SOURCE_SANS_THREE` *(deprecated)*, `NUNITO_SANS`, `ARIMO`, `HANKEN_GROTESK`, `RUBIK`, `GEIST`, `DM_SANS`, `IBM_PLEX_SANS`, `SORA`, `ANYBODY`, `ANTON`, `ARCHIVO_NARROW`, `ATKINSON_HYPERLEGIBLE_NEXT`, `BARLOW_CONDENSED`, `BEBAS_NEUE`, `BODONI_MODA`, `BRICOLAGE_GROTESQUE`, `CHIVO`, `CLIMATE_CRISIS`, `COMFORTAA`, `COURIER_PRIME`, `FIRA_SANS`, `GOOGLE_SANS`, `GOOGLE_SANS_CODE`, `GOOGLE_SANS_FLEX`, `GOOGLE_SANS_MONO`, `GOOGLE_SANS_TEXT`, `IBM_PLEX_SERIF`, `JETBRAINS_MONO`, `KARLA`, `LIBRE_FRANKLIN`, `MERRIWEATHER`, `NOTO_SANS`, `OPEN_SANS`, `OSWALD`, `OUTFIT`, `PLAYFAIR_DISPLAY`, `POIRET_ONE`, `QUESTRIAL`, `QUICKSAND`, `RALEWAY`, `ROBOTO_FLEX`, `SPACE_MONO`, `SYNE`, `VOLLKORN`.

---

### 3.3 `generate_screen_from_text`
- **Schema File**: `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\generate_screen_from_text.json`
- **Purpose**: Generates high-fidelity UI screens from natural language prompts.
- **Parameters**:
  - `projectId` (`string`, **required**): Project ID **without** `projects/` prefix.
  - `prompt` (`string`, **required**): Screen prompt describing components, layout, tokens, and glyphs.
  - `designSystem` (`string`, optional): Design system resource name formatted as `assets/{asset_id}` (e.g. `assets/15996705518239280238`). If omitted on first run, Stitch auto-derives one.
  - `deviceType` (`string`, optional): Enum `["DEVICE_TYPE_UNSPECIFIED", "MOBILE", "DESKTOP", "TABLET", "AGNOSTIC"]`.
  - `modelId` (`string`, optional): Enum `["MODEL_ID_UNSPECIFIED", "GEMINI_3_8_FLASH", "GEMINI_3_5_FLASH_LITE"]`.
- **Required Fields**: `projectId`, `prompt`.
- **Runtime Handling Directives**:
  - Generation takes 1–3 minutes. **DO NOT RETRY** on timeout.
  - On timeout or disconnection, poll `get_screen` every 30 seconds for up to 10 iterations.
  - Inspect `output_components`: If it contains iterative suggestions (e.g., `"Yes, make them all"`), prompt may be chained.

---

### 3.4 `get_screen`
- **Schema File**: `C:\Users\yashv\.gemini\antigravity\mcp\StitchMCP\get_screen.json`
- **Purpose**: Retrieves screen specifications, code, and rendered preview URLs.
- **Parameters**:
  - `name` (`string`, **required**): Resource identifier formatted as `projects/{project}/screens/{screen}`.  
    Example: `projects/4044680601076201931/screens/98b50e2ddc9943efb387052637738f61`.
- **Required Fields**: `name`.

---

## 4. Secondary & Discovered Stitch Tools Specification

### 4.1 `list_screens`
- **Parameters**: `projectId` (`string`, **required**, without `projects/` prefix).
- **Use Case**: Post-generation discovery of all screen IDs created in a project.

### 4.2 `update_design_system`
- **Parameters**:
  - `name` (`string`, **required**): Resource name formatted as `assets/{asset_id}`.
  - `projectId` (`string`, **required**): Project ID without `projects/` prefix.
  - `designSystem` (`object`, **required**): Same schema as `create_design_system`.
- **Use Case**: Must be executed after `create_design_system` to apply tokens to project UI.

### 4.3 `upload_design_md` & `create_design_system_from_design_md`
- **Alternative Pipeline**:
  1. `upload_design_md`: `projectId` (without prefix) + `designMdBase64` (base64 UTF-8 string).
  2. `create_design_system_from_design_md`: `projectId` + `selectedScreenInstance: { "id": "<screen_instance_id>", "sourceScreen": "projects/{project}/screens/{screen}" }`.

### 4.4 `apply_design_system`
- **Parameters**:
  - `projectId` (`string`, **required**, without prefix)
  - `assetId` (`string`, **required**, without `assets/` prefix)
  - `selectedScreenInstances` (`array` of objects, **required**): `[{ "id": string, "sourceScreen": string }]`

### 4.5 `edit_screens` & `generate_variants`
- **Parameters**:
  - `projectId` (`string`, **required**, without prefix)
  - `selectedScreenIds` (`array` of strings, **required**, without `screens/` prefix)
  - `prompt` (`string`, **required**)
  - In `generate_variants`: `variantOptions` (`object`, **required**) with `variantCount` (1–5), `creativeRange` (`REFINE`, `EXPLORE`, `REIMAGINE`), and `aspects` (`LAYOUT`, `COLOR_SCHEME`, `IMAGES`, `TEXT_FONT`, `TEXT_CONTENT`).

---

## 5. Validation & Discrepancy Audit of Explorer 3's Proposals

| Parameter / Aspect | Explorer 3 Proposal | Authoritative Schema Rule | Compliance Status | Corrective Action / Note |
|---|---|---|---|---|
| `create_project.title` | `"Sonus Adaptive Musical Practice - Living Manuscript"` | `title` (`string`, optional) | **COMPLIANT** | Valid string. |
| `create_design_system.projectId` | `"<PROJECT_ID>"` | `projectId` without `projects/` | **COMPLIANT** | Valid naked ID format. |
| `theme.colorMode` | `"LIGHT"` | Enum `["LIGHT", "DARK"]` | **COMPLIANT** | Valid enum. |
| `theme.headlineFont` | `"PLAYFAIR_DISPLAY"` | Enum list (68 entries) | **COMPLIANT** | Matches `Playfair Display`. |
| `theme.bodyFont` | `"NEWSREADER"` | Enum list (68 entries) | **COMPLIANT** | Matches editorial serif body. |
| `theme.labelFont` | `"JETBRAINS_MONO"` | Enum list (68 entries) | **COMPLIANT** | Valid monospace enum. |
| `theme.roundness` | `"ROUND_FOUR"` | Enum `["ROUND_FOUR", "ROUND_EIGHT", ...]` | **COMPLIANT** | `ROUND_FOUR` is the lowest supported roundness. `--radius: 0` is enforced in `designMd` and prompt. |
| `theme.customColor` | `"#9A2A2A"` | Hex format string | **COMPLIANT** | Crimson accent seed. |
| Design System Application | Only called `create_design_system` | Schema instructs: *"Call update_design_system tool immediately after"* | **DISCREPANCY** | Worker must call `update_design_system` with returned `assets/{asset_id}` or pass `assets/{asset_id}` into `generate_screen_from_text`. |
| `generate_screen_from_text.projectId` | `"<PROJECT_ID>"` | String without `projects/` | **COMPLIANT** | Valid naked ID format. |
| `generate_screen_from_text.designSystem` | `"assets/<ASSET_ID>"` | String `assets/{asset_id}` | **COMPLIANT** | Valid format. |
| `generate_screen_from_text.deviceType` | `"DESKTOP"` | Enum `["MOBILE", "DESKTOP", ...]` | **COMPLIANT** | Valid enum. |
| `generate_screen_from_text.modelId` | `"GEMINI_3_8_FLASH"` | Enum `["GEMINI_3_8_FLASH", ...]` | **COMPLIANT** | Valid enum. |
| `get_screen.name` | Omitted exact payload; noted "by screen ID" | `name` (`projects/{project}/screens/{screen}`) | **OMISSION** | Must supply complete resource path `projects/{project}/screens/{screen}`. |

---

## 6. Validated Tool Call Payloads for Worker Execution

### 6.1 Step 1: `create_project`
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "create_project",
  "Arguments": {
    "title": "Sonus Adaptive Musical Practice - Living Manuscript"
  }
}
```
*Expected Return*: `projects/{PROJECT_ID}` (extract numeric ID, e.g., `4044680601076201931`).

---

### 6.2 Step 2: `create_design_system`
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "create_design_system",
  "Arguments": {
    "projectId": "<PROJECT_ID>",
    "designSystem": {
      "displayName": "Living Manuscript",
      "theme": {
        "colorMode": "LIGHT",
        "customColor": "#9A2A2A",
        "overrideNeutralColor": "#F4F1EA",
        "overridePrimaryColor": "#9A2A2A",
        "overrideSecondaryColor": "#2C2A29",
        "colorVariant": "MONOCHROME",
        "headlineFont": "PLAYFAIR_DISPLAY",
        "bodyFont": "NEWSREADER",
        "labelFont": "JETBRAINS_MONO",
        "roundness": "ROUND_FOUR",
        "designMd": "# Design System: Living Manuscript\n\n- Concept: Interactive musical instrument masquerading as sheet music.\n- Background: Parchment (#F4F1EA)\n- Structural Staves: Charcoal hairline borders (#2C2A29)\n- Accents & Intonation Errors: Crimson Ink (#9A2A2A)\n- Typography: Playfair Display serif headers, Geist/JetBrains Mono technical telemetry.\n- Sharp corners: Strict zero border radius (--radius: 0), zero SaaS drop shadows, zero blue pill buttons."
      }
    }
  }
}
```
*Expected Return*: Asset resource identifier `assets/{ASSET_ID}` (e.g. `assets/15996705518239280238`).

---

### 6.3 Step 2b: `update_design_system` (Mandated by Schema Directive)
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "update_design_system",
  "Arguments": {
    "name": "assets/<ASSET_ID>",
    "projectId": "<PROJECT_ID>",
    "designSystem": {
      "displayName": "Living Manuscript",
      "theme": {
        "colorMode": "LIGHT",
        "customColor": "#9A2A2A",
        "overrideNeutralColor": "#F4F1EA",
        "overridePrimaryColor": "#9A2A2A",
        "overrideSecondaryColor": "#2C2A29",
        "colorVariant": "MONOCHROME",
        "headlineFont": "PLAYFAIR_DISPLAY",
        "bodyFont": "NEWSREADER",
        "labelFont": "JETBRAINS_MONO",
        "roundness": "ROUND_FOUR",
        "designMd": "# Design System: Living Manuscript\n\n- Background: #F4F1EA\n- Structural lines: #2C2A29\n- Accent ink: #9A2A2A\n- Radius: 0"
      }
    }
  }
}
```

---

### 6.4 Step 3: Screen Generations (`generate_screen_from_text`)

#### Screen 1: Landing Page (with Ink Bleed Effect & Clerk Auth)
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "generate_screen_from_text",
  "Arguments": {
    "projectId": "<PROJECT_ID>",
    "designSystem": "assets/<ASSET_ID>",
    "deviceType": "DESKTOP",
    "modelId": "GEMINI_3_8_FLASH",
    "prompt": "Create a desktop landing page for 'Sonus: Opus Manuscriptum', an adaptive musical practice system built with the 'Living Manuscript' aesthetic. The background is warm off-white parchment paper (#F4F1EA) with faint horizontal 5-line musical staff watermark lines. The layout features stark charcoal structural borders (#2C2A29) and rich crimson ink accents (#9A2A2A). At the top center, display a prominent editorial serif title 'Opus Manuscriptum' with an ink-bleed effect aesthetic, accompanied by the subtitle 'An experimental adaptive instrument masquerading as sheet music'. In the center, provide an authentic, classical parchment-styled authentication card containing Clerk sign-in controls (email/password and SSO options) with sharp 0-radius charcoal buttons and serif typography, completely avoiding generic blue SaaS pill buttons. Decorate with musical glyphs: treble clef (𝄞), fermata (𝄐), and coda (𝄌). Include three minimalist feature columns aligned to horizontal staff lines: 'I. Acoustic Intonation Flow', 'II. Spatial Canvas Architecture', and 'III. Constellation Retrospectives'."
  }
}
```

#### Screen 2: Setup / Tuning Ritual (Auto-detect Mic vs MIDI)
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "generate_screen_from_text",
  "Arguments": {
    "projectId": "<PROJECT_ID>",
    "designSystem": "assets/<ASSET_ID>",
    "deviceType": "DESKTOP",
    "modelId": "GEMINI_3_8_FLASH",
    "prompt": "Create a desktop device calibration screen titled 'The Tuning Ritual' for Sonus, adhering to the Living Manuscript design system. The background is parchment (#F4F1EA) with 5-line structural staff grids in charcoal (#2C2A29). The screen is a pre-practice sanctuary for audio calibration. In the upper region, show a device auto-detection status bar with crisp monospace telemetry: 'INPUT: Built-in Array Microphone [48.0 kHz]' and 'MIDI: USB MIDI Interface [Connected, Ch 1-16]'. In the center, display a high-precision pitch tuning dial: a prominent pitch reference label 'A4 = 440 Hz' in elegant Playfair Display serif, flanked by an intonation cents deviation ribbon (-50 to +50 cents) with a crimson ink needle indicator (#9A2A2A) and musical staccato dot guide marks. Below the tuner, display a live waveform pitch oscilloscope rendered as a charcoal ink wave. At the bottom, a prominent charcoal button with a fermata glyph reads 'Enter the Sanctuary (Begin Practice)'. No generic shadows, cards, or rounded pill buttons."
  }
}
```

#### Screen 3: Composer's Bio Profile
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "generate_screen_from_text",
  "Arguments": {
    "projectId": "<PROJECT_ID>",
    "designSystem": "assets/<ASSET_ID>",
    "deviceType": "DESKTOP",
    "modelId": "GEMINI_3_8_FLASH",
    "prompt": "Create a desktop user profile and repertoire folio screen titled 'Composer's Folio' for the Sonus musical practice platform, following the Living Manuscript design system. The canvas is off-white parchment (#F4F1EA) with charcoal hairline rules (#2C2A29). At the top, show the musician's profile card with an ink-sketch avatar silhouette, musician name 'Maestro Julian Vance', primary instrument 'Cello', and practice discipline badge 'XIV Days Consecutively'. The main body is split into two parchment ledger panels: The left panel is 'Repertoire & Opus Catalog' listing musical pieces (e.g., J.S. Bach Cello Suite No. 1 in G Major, Elgar Cello Concerto Op. 85) with difficulty ratings in Roman numerals, mastery percentage indicators rendered as ink bar gauges, and tempo targets. The right panel is 'Technical Telemetry' showing historical practice statistics in crisp monospace typography (Total Practice Time: 124.5 Hours, Intonation Precision: 96.2%, Rhythm Deviation: ±7ms). All styling uses sharp corners, Playfair Display headers, and crimson ink accents (#9A2A2A)."
  }
}
```

#### Screen 4: Constellation History Scatter Plot
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "generate_screen_from_text",
  "Arguments": {
    "projectId": "<PROJECT_ID>",
    "designSystem": "assets/<ASSET_ID>",
    "deviceType": "DESKTOP",
    "modelId": "GEMINI_3_8_FLASH",
    "prompt": "Create a desktop practice history and session archive screen titled 'Chronicle of Sessions: The Constellation' for Sonus, using the Living Manuscript parchment aesthetic (#F4F1EA). The central visual element is a full-width astronomical-style constellation scatter plot where every past practice session is plotted as an ink node on parchment. The horizontal axis represents session date/timeline and the vertical axis represents Intonation Accuracy (80% to 100%). Nodes are rendered as delicate charcoal stars, with node diameter proportional to session duration, connected by faint golden-charcoal constellation lines grouped by musical opus. Highly accurate sessions shine with charcoal density, while sessions with notable intonation errors feature crimson ink halos (#9A2A2A). Selecting a node opens a side ledger showing the session's 'Architectural Blueprint': a zoomed-out score timeline with crimson editor's marks (circled sharp/flat notes, measure slashes) and session telemetry in monospace font."
  }
}
```

---

### 6.5 Step 4: Verification Payloads (`list_screens` & `get_screen`)

#### Discover Screen IDs via `list_screens`
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "list_screens",
  "Arguments": {
    "projectId": "<PROJECT_ID>"
  }
}
```

#### Retrieve Individual Screen via `get_screen`
```json
{
  "ServerName": "StitchMCP",
  "ToolName": "get_screen",
  "Arguments": {
    "name": "projects/<PROJECT_ID>/screens/<SCREEN_ID>"
  }
}
```

---

## 7. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `create_design_system` | Missing required `theme.roundness` or `theme.customColor` | Server schema validation failure (`Missing required property`). |
| 2 | `create_design_system` | Requesting zero border radius via unsupported enum (e.g. `"ROUND_ZERO"`) | Schema enum rejection. Valid enums only: `ROUND_FOUR`, `ROUND_EIGHT`, `ROUND_TWELVE`, `ROUND_FULL`. |
| 3 | `create_design_system` | `projectId` prefixed with `projects/` (e.g. `projects/12345`) | Tool parameter rejection. Schema explicitly mandates project ID without `projects/` prefix. |
| 4 | `get_screen` | `name` supplied as naked screen ID (e.g. `98b50e2ddc9943...`) | Fails with invalid resource identifier error. Schema requires `projects/{project}/screens/{screen}` format. |
| 5 | `apply_design_system` | `assetId` formatted with `assets/` prefix (e.g. `assets/15996...`) | Fails schema format. Schema explicitly mandates `assetId` without `assets/` prefix. |
| 6 | `update_design_system` | `name` passed without `assets/` prefix | Fails schema format. `name` must include `assets/` prefix. |
| 7 | `upload_design_md` | Base64 string containing non-UTF-8 bytes | Upload rejected by server validation (`decoded content must be valid UTF-8`). |
| 8 | `generate_screen_from_text` | Invoking retry immediately after timeout | Generation queue collision or duplicate screen generation. Schema explicitly states: `"DO NOT RETRY. Instead, try to get the screen with get_screen every 30 seconds for up to 10 times."` |
| 9 | `call_mcp_tool` (Subagent Mode) | Background subagent invoking Stitch MCP tool without user in foreground | Antigravity client issues interactive prompt to user. If unclicked, times out after 60 seconds with `permission check failed`. |
