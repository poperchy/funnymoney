# NavBar

Header for the marketing site, in a rounded `navshell` (`radius-3xl`, `line` border). “Product ▾” opens a mega menu: a white panel (`shadow-feature`) of six items, each a 30px rounded gradient square (`grad-dot-N`), a title and a one-line description. Right side: “Sign in” and a `dark` CTA.

- `variant="minimal"` is the slim version for blog and docs: logo with a section label, four links, and a text CTA.
- Pass `menu` (title, body, href) to enable the mega menu; `defaultOpen` shows it open.
