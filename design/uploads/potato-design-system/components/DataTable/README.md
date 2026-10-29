# DataTable

A results table built from grid rows: white `radius-3xl` box with a `line` border, a 13px 500 header in `ink-muted`, 15px labels and 14px values with tabular figures. Mark a value `{value, tone:'bad'}` for a regression (`danger`) or `'good'` for an improvement (`success`); the word or number itself always carries the meaning. `note` adds the small “mock data · 500 storefronts” line.

- `template` overrides the column widths (default: one wide label column, the rest equal).
