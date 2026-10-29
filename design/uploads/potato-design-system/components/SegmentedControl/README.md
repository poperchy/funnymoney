# SegmentedControl

A pill track (`fill-subtle`, 5px padding) whose active option is a white pill lifted with `shadow-pill`. Used for tabs with media, Monthly / Yearly pricing and the careers department filter.

- `options`: strings or `{label, value}`. Controlled with `value` + `onChange`, or uncontrolled with `defaultValue`.
- Two to five short options; labels are 14px sentence case. For a filter row with counts on a page, use `FilterPills` instead.
