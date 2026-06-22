# NPC doodle image-generation spec

Image-generation route for NPC easel doodles. Alternative to the stroke-program path in `npc-canvas-spec.md`. Produces crisp pixel sprites from an OpenRouter image model, post-processed to a real grid, QC-gated, stored as static assets, and revealed on the easel via a faked paint animation.

Use this route when the goal is recognizable finished doodles for arbitrary/random subjects. It does not produce a real paint process — there are no strokes. The watch-it-draw effect is faked at playback (see §7). If the stroke mechanic is the feature, use `npc-canvas-spec.md` instead, not this.

## 1. Scope

**In:** a subject noun (per-NPC fixation, grounded in stage scenery), a stage palette, target grid size.

**Out:** a palette-quantized pixel sprite (PNG + index grid), stored static, plus a manifest entry.

Generation is offline (`npm run doodles:generate` or generate-once-curate). Never on a user's critical path.

No cron, no stored tier state. Lifecycle from timestamps + manifest, same as everywhere else.

## 2. Pipeline

```
subject → prompt build → OR image call → downscale+quantize → QC gate → store
                                                              │
                                                         drop on fail
```

Per doodle, all offline:

1. Pick subject (random from NPC's fixation set for that stage)
2. Build prompt (§3)
3. Call OpenRouter image model (§4) → raw raster (~512–1024px)
4. Downscale to true grid + quantize to stage palette (§5) → index grid + sprite PNG
5. QC: vision gate for recognizability (§6) → keep or drop
6. On keep: write asset + manifest entry. On drop: leave easel empty this cycle.

Latency is irrelevant (offline). Budget is wall-clock of the batch only; parallelize across the roster.

## 3. Subject + prompt

Subject comes from the NPC's fixation pool (`lib/easel/doodle/fixation.ts`). No scaffold library — random subjects make that impossible. Recognizability is carried by the model's subject priors + the QC gate, not by a template.

Prompt template (text-to-image):

```
{subject}, single centered object, pixel art sprite,
flat colors, hard edges, no anti-aliasing, no gradients,
no background (solid {bg_hex}), no text, no shadow,
limited palette, retro 16-bit game asset
```

Notes:

- "single centered object" + "no background" is what makes the downscale clean later.
- Do not rely on a pixel-art LoRA — OpenRouter hosts the model, you don't attach weights. Styling is prompt-only; the crisp grid comes from post-process (§5), not the model.
- `{bg_hex}` = the stage's easel/canvas background, so quantization can key it out to transparent.

## 4. Generation call

OpenRouter, image output via the chat-completions / modalities path. Model: `black-forest-labs/flux.2-klein`.

Request 1:1; fine pixel dimensions are set in post (§5), not the API.

## 5. Downscale + quantize

Implemented in `lib/easel/doodle/quantize.ts`:

1. Crop to the object's bounding box (background is solid `{bg_hex}`; flood from corners)
2. Downscale to target grid (default 24×24) using cubic resize + palette snap
3. Quantize every cell to the nearest color in the fixed stage palette
4. Key out cells matching `{bg_hex}` → transparent
5. Emit `grid.json` + `sprite.png` (×4 nearest-neighbor upscale)

## 6. QC gate

Implemented in `lib/easel/doodle/qc.ts`. Vision model scores recognizability 1–10; keep if score ≥ 6.

Drop-on-fail is mandatory. Optional retry up to N=2 before giving up.

## 7. Playback — faked reveal

Implemented in `components/game/easel/DoodleSpriteDrawing.tsx`:

- Finished sprite sits static on the easel (`<img>`)
- Cover cells (solid `{bgHex}`) fade out via `opacity` only — stipple (per-pixel) or band wipe
- Reveal progress uses the same watched-clock / checkpoint pattern as stroke easels
- Advances only while a real user is present (painter-ready gate)

## 8. Storage

```
/public/doodles/{stage}/{npc}/{cycle}/
    grid.json
    sprite.png

/data/doodle-manifest.json
```

Empty easel = omitted entry (drop-on-fail). Default workflow: generate-once-and-curate.

## 9. Cost + perf budget

~$0.015–0.02 per accepted doodle (Klein + vision QC). Runtime: opacity-only covers → GPU-composited, near-zero cost.

## Testing on page load

Doodles only appear when **both** are true:

1. A manifest entry exists for the stage + NPC (`data/doodle-manifest.json`, stage slug = URL e.g. `lasvegas`)
2. The easel row uses a doodle program (not a cached stroke program from the DB)

### Quick test (local dev)

Load with a forced easel reset — hides the old stroke drawing and starts fresh from the manifest:

```
/lasvegas?freshEasel=1
```

`freshEasel=1` only works when `NODE_ENV=development`.

### Without the query param

On sync, stroke easels **auto-upgrade** to manifest doodles when an entry exists for that NPC + stage. Reload `/lasvegas` after pulling manifest changes — no DB wipe needed.

### Still seeing strokes?

- Confirm manifest has `lasvegas` entries (not `edc`)
- NPC id must match pool key (`gen-edc-ace` → manifest `npc: "ace"`)
- Use `?freshEasel=1` to force a new drawing on load

| Spec section | Code |
|---|---|
| Fixation + prompt | `lib/easel/doodle/fixation.ts`, `prompt.ts` |
| Image gen | `lib/easel/doodle/imageGen.ts` |
| Quantize | `lib/easel/doodle/quantize.ts` |
| QC | `lib/easel/doodle/qc.ts` |
| Manifest | `data/doodle-manifest.json`, `lib/easel/doodle/manifest.ts` |
| Runtime pick | `lib/easel/doodle/program.ts` → `generateDrawing.ts` |
| Reveal playback | `components/game/easel/DoodleSpriteDrawing.tsx` |
| Offline batch | `scripts/generate-npc-doodles.ts` |
