# PricingTiers

`pricing.tiers` — a `block` headline with a Monthly / Yearly control, then three tiers. A tier: name, a 42px price with “/ mo”, a sub-line, a hairline, ✓ features in `accent`, and a full-width button. The `featured` tier takes `grad-tier`, a 40% accent border, `shadow-feature`, the “most picked” badge and the `primary` button; the others use `soft`.

- Numeric prices are discounted by `yearlyDiscount` (0.2) when Yearly is on; a string (“Talk”) is shown as-is.
- Exactly one featured tier, in the middle.
