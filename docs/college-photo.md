# User-provided college background photograph

The user explicitly rejected the earlier gate photo and provided **`image-1.png`** for the UI background on 19 November 2026. This uploaded image, not a search result or an AI substitute, is now used.

## Assets and identity

- Preserved upload: `docs/images/college-campus-original.png` — 1000 × 400 pixels, 844,006 bytes.
- Original SHA-256: `a21b677670775c000861c1c4f9f5b566674fb9e47c79ec42ae62f17ccffefadd`.
- Runtime background: `site/assets/college-campus.webp` — 1000 × 400 pixels, 136,882 bytes.
- Runtime SHA-256: `6f59c08d3eb4b5ccdaf398758970678088fd2ad11edb29315311cd3f00a63892`.
- Conversion: ImageMagick, `-strip -quality 90 -define webp:method=6`. No upscaling, fabricated structures, AI restyling, retouching or permanent cropping.
- The rejected `college-gate.webp`, newspaper attribution and the separate home photo card have been removed.

## Presentation

The photograph is an actual CSS background in the full-bleed homepage hero and the college-information heading, with a very faint version beneath the shared reading canvas. Deep teal/sky overlays match the building, trees and sky while keeping text readable. Color grading and responsive positioning are CSS-only: the original upload remains unchanged. On phones the photo has a dedicated upper background area so a tall `cover` crop does not turn the building into an unrecognizable narrow strip. A normal local link opens the complete 1000 × 400 image.

The hero's background has an accessible image description; the visible college name conveys its context. It is locally served, preloaded on the homepage and included in the verified offline manifest. No Facebook/CDN request or expiring signed URL is required.

The user supplied and identified this campus image for this use. No open-content license or college endorsement is asserted. Rights remain with the original rights holder; user submission is not a claim that the user took or owns the photograph.

## Random motion

The campus backdrop itself and all reading text remain steady. `galaxy.js` seeds floating points, cross-shaped stars, shooting stars and subtle halos with randomized positions, colors, paths, sizes, durations and negative delays. CSS supplies seven complementary motion patterns (including the nebula, star field and light sweep). The seed is generated once per load/viewport class, not on an animation loop.

Desktop: 86 campus decorations + 32 ambient decorations, maximum 118 generated nodes. Phones (≤760 px): 45 + 18, maximum 63. Repeated toggles/visibility changes never append duplicates. A breakpoint change replaces the existing field rather than adding another. Initial reduced motion, a saved pause, or a hidden document allocates no particles until motion is allowed. The existing pause setting, live OS preference, cross-tab sync, hidden-tab suspension, no-JS static fallback and clear Bengali numeral font are preserved.
