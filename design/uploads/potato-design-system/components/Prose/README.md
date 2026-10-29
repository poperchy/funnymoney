# Prose

The article body. Wrap CMS HTML (`html`) or children in it and every element the CMS can emit gets the house style: body 18/1.7 in `ink-body`, h2–h6 from the Headings scale, inline `code` (`accent-wash` / `accent-deep`), `kbd` with a 2px bottom border, `mark` in `grad-mark`, struck text in `ink-muted`, lists with 8px gaps, blockquote with a 2px `quote-rule`, `hr` in `line-strong`, `.small` print and `.footnotes`.

- Width is the 720px `measure`; paragraphs are spaced 22px, an h2 takes 52px above.
- Headings use `text-wrap: balance`, paragraphs `pretty`. Tables and code scroll inside their box; the page never scrolls sideways.
- Put block components (Callout, CodeBlock, DataTable, PullQuote, StepList, Figure, ArticleCTA) inside it between paragraphs.
