# Button

Pill buttons (`radius-pill`), Instrument Sans 500. The consumer provides the label and either `href` (renders `<a>`) or `onClick`.

| variant | look | use |
|---|---|---|
| `primary` | `grad-primary` (accent → accent-2), white text | The one conversion action of a view: “Check a site free →”, “Start agency trial”, “Send message”. |
| `dark` | `surface-inverse`, `surface` text | Product CTA in headers and split heroes (“Check a site”), Subscribe, Accept. |
| `secondary` | white, `line-control` border | Neutral actions: Register, Copy snippet, Reject. |
| `glass` | `surface-glass`, `line-control` border | Second button over blobs and tints (hero, CTA banner). |
| `soft` | `surface-sunken` fill | Non-featured pricing tiers. |
| `link` | text in `link` with an arrow | Tertiary: “See agency pricing →”, Settings. |

Sizes: `sm` 9/17 px 14px, `md` 12/22 15px, `lg` 14/26 15px, `xl` 14/28 16px. Labels are sentence case and verb-first; a trailing “→” marks navigation. At most one `primary` per view.
