# BentoGrid

`features.bento` — a `section` headline over a four-column bento (`radius-hero` tiles, rows ≥170px). Tile kinds, all from `tiles`:

- Every tile has a `label` — 13px 500 in `ink-muted` (`accent` with `accent:true`).
- `size:"big"` 2×2 white tile with an `accent` label, a 24px title and diff rows (`kind`: `bad` → `danger`, `new` → `accent`, `good` → `success`).
- `tone:"tint1…4"` small number tiles (34px value + note).
- `tone:"dark"` wide alert tile on `surface-inverse`: `code-key` label, timestamp aside, 16px sentence.
- `tags` for small third-party tags; `bars` + `limit` for a 14-day mini chart whose over-budget bars turn `danger`.
