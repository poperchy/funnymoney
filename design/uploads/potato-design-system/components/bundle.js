/* @ds-bundle: {"format":4,"namespace":"Potato","components":[{"name":"Logo"},{"name":"Button"},{"name":"IconButton"},{"name":"SegmentedControl"},{"name":"FilterPills"},{"name":"Chip"},{"name":"Tag"},{"name":"Field"},{"name":"InlineForm"},{"name":"Switch"},{"name":"MediaPlaceholder"},{"name":"Breadcrumb"},{"name":"ArticleHeader"},{"name":"TableOfContents"},{"name":"ReadingProgress"},{"name":"Prose"},{"name":"Callout"},{"name":"CodeBlock"},{"name":"DataTable"},{"name":"PullQuote"},{"name":"StepList"},{"name":"Figure"},{"name":"ArticleCTA"},{"name":"PostCard"},{"name":"FeaturedPost"},{"name":"BlockLabel"},{"name":"AnnouncementBar"},{"name":"SiteHeader"},{"name":"NavBar"},{"name":"HeroCentered"},{"name":"HeroSplit"},{"name":"LogoStrip"},{"name":"FeatureGrid"},{"name":"StatsRow"},{"name":"Steps"},{"name":"TabsMedia"},{"name":"CodeShowcase"},{"name":"Gallery"},{"name":"CardSlider"},{"name":"ReviewsGrid"},{"name":"TestimonialSpotlight"},{"name":"PricingTiers"},{"name":"ComparisonTable"},{"name":"FAQ"},{"name":"LatestPosts"},{"name":"Newsletter"},{"name":"ContactForm"},{"name":"CTABanner"},{"name":"Footer"},{"name":"BentoGrid"},{"name":"VideoDemo"},{"name":"Timeline"},{"name":"CareersList"},{"name":"EventsGrid"},{"name":"CookieConsent"},{"name":"ErrorPage"},{"name":"ComingSoon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useEffect = React.useEffect;
  var F = React.Fragment;

  function cx() { var out = []; for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); } return out.join(' '); }
  function grad(kind, i) { return 'var(--grad-' + kind + '-' + ((i % 4) + 1) + ')'; }
  function pick(o, keys) { var r = {}; for (var k in o) { if (keys.indexOf(k) < 0) r[k] = o[k]; } return r; }

  /* ---------- atoms ---------- */

  function Logo(p) {
    p = p || {};
    return h('span', { className: cx('pt-logo', p.size === 'sm' && 'is-sm', p.className) },
      h('span', { className: 'pt-logo-mark', 'aria-hidden': 'true' }),
      p.hideWord ? null : h('span', { className: 'pt-logo-word' }, p.name || 'potato'),
      p.section ? h('span', { className: 'pt-logo-sub' }, '/ ' + p.section) : null);
  }

  function Button(p) {
    var variant = p.variant || 'secondary', size = p.size || 'md';
    var cls = cx('pt-btn', 'pt-btn-' + variant, 'pt-btn-' + size, p.block && 'pt-btn-block', p.className);
    var rest = pick(p, ['variant', 'size', 'block', 'className', 'children', 'href']);
    if (p.href) return h('a', Object.assign({ href: p.href, className: cls }, rest), p.children);
    return h('button', Object.assign({ type: 'button', className: cls }, rest), p.children);
  }

  function IconButton(p) {
    var rest = pick(p, ['glass', 'label', 'children', 'className']);
    return h('button', Object.assign({ type: 'button', 'aria-label': p.label, className: cx('pt-iconbtn', p.glass && 'is-glass', p.className) }, rest), p.children);
  }

  function SegmentedControl(p) {
    var opts = p.options || [];
    var _s = useState(p.defaultValue != null ? p.defaultValue : (opts[0] && (opts[0].value != null ? opts[0].value : opts[0])));
    var val = p.value != null ? p.value : _s[0];
    return h('div', { className: 'pt-seg', role: 'tablist', 'aria-label': p.label },
      opts.map(function (o) {
        var v = o.value != null ? o.value : o, lab = o.label != null ? o.label : o;
        return h('button', { key: v, type: 'button', role: 'tab', 'aria-selected': v === val, className: cx('pt-seg-opt', v === val && 'is-on'),
          onClick: function () { _s[1](v); p.onChange && p.onChange(v); } }, lab);
      }));
  }

  function FilterPills(p) {
    var opts = p.options || [];
    var _s = useState(p.defaultValue != null ? p.defaultValue : (opts[0] && opts[0].label));
    var val = p.value != null ? p.value : _s[0];
    return h('div', { className: 'pt-filters' }, opts.map(function (o) {
      return h('button', { key: o.label, type: 'button', 'aria-pressed': o.label === val, className: cx('pt-filter', o.label === val && 'is-on'),
        onClick: function () { _s[1](o.label); p.onChange && p.onChange(o.label); } },
        o.label, o.count != null ? h('span', { className: 'pt-filter-count' }, o.count) : null);
    }));
  }

  var CAT = { Benchmark: 'benchmark', Comparison: 'comparison', 'By role': 'role', Engineering: 'engineering' };
  function Chip(p) {
    var tone = p.tone || CAT[p.children] || 'neutral';
    return h('span', { className: cx('pt-chip', 'pt-chip-' + tone, p.className) }, p.children);
  }
  function Tag(p) { return h(p.href ? 'a' : 'span', { href: p.href, className: cx(p.size === 'sm' ? 'pt-tag-sm' : 'pt-tag', p.size === 'sm' && p.tone === 'danger' && 'is-danger') }, p.children); }

  function Field(p) {
    var rest = pick(p, ['label', 'multiline', 'full', 'className']);
    return h('label', { className: cx('pt-field', p.full && 'full', p.className) },
      h('span', { className: 'pt-field-label' }, p.label),
      p.multiline ? h('textarea', Object.assign({ rows: 4, className: 'pt-input' }, rest)) : h('input', Object.assign({ className: 'pt-input' }, rest)));
  }

  function InlineForm(p) {
    var _v = useState(''), _d = useState(false);
    return h('form', { className: cx('pt-inline-form', p.size === 'sm' && 'is-sm'), onSubmit: function (e) { e.preventDefault(); _d[1](true); p.onSubmit && p.onSubmit(_v[0]); } },
      h('input', { type: p.type || 'email', placeholder: p.placeholder || 'you@company.com', 'aria-label': p.label || 'Email', value: _v[0], onChange: function (e) { _v[1](e.target.value); _d[1](false); } }),
      h('button', { type: 'submit', className: 'pt-btn pt-btn-dark' }, _d[0] ? (p.doneLabel || 'Subscribed ✓') : (p.action || 'Subscribe')));
  }

  function Switch(p) {
    var _s = useState(!!p.defaultChecked);
    var on = p.checked != null ? p.checked : _s[0];
    return h('button', { type: 'button', role: 'switch', 'aria-checked': on, 'aria-label': p.label, disabled: p.locked,
      className: cx('pt-switch', on && 'is-on', p.locked && 'is-locked'),
      onClick: function () { if (p.locked) return; _s[1](!on); p.onChange && p.onChange(!on); } },
      h('span', { className: 'pt-switch-knob' }));
  }

  function MediaPlaceholder(p) {
    var style = Object.assign({}, p.ratio ? { aspectRatio: p.ratio } : null, p.background ? { background: p.background } : null, p.style);
    return h('div', { className: cx('pt-media', p.src && 'has-src', p.className), style: style },
      p.src ? (p.video ? h('video', { src: p.src, controls: true }) : h('img', { src: p.src, alt: p.alt || '' })) : (p.label || 'media'));
  }

  /* ---------- article ---------- */

  function Breadcrumb(p) {
    var items = p.items || [];
    var out = [];
    items.forEach(function (it, i) {
      var last = i === items.length - 1;
      if (i) out.push(h('span', { key: 's' + i, className: 'sep' }, '/'));
      out.push(last ? h('span', { key: i, className: 'cur', 'aria-current': 'page' }, it.label) : h('a', { key: i, href: it.href || '#' }, it.label));
    });
    return h('nav', { className: 'pt-crumbs', 'aria-label': 'Breadcrumb' }, out);
  }

  function Byline(p) {
    return h('div', { className: 'pt-byline' },
      h('span', { className: 'pt-avatar', style: p.avatar ? { background: p.avatar } : null }, p.initial || (p.name || '?').charAt(0)),
      h('div', null, h('div', { className: 'pt-byline-name' }, p.name), h('div', { className: 'pt-byline-role' }, p.role)));
  }

  function ArticleHeader(p) {
    return h('header', { className: 'pt-article-head' },
      p.breadcrumb ? h(Breadcrumb, { items: p.breadcrumb }) : null,
      h('h1', null, p.title),
      p.lead ? h('p', { className: 'lead' }, p.lead) : null,
      h('div', { className: 'pt-byline-row' },
        h(Byline, p.author || {}),
        h('div', { className: 'pt-meta' }, h('time', { dateTime: p.datetime }, p.date), p.readTime ? h(F, null, h('span', { className: 'sep' }, '·'), h('span', null, p.readTime)) : null)));
  }

  function TableOfContents(p) {
    return h('nav', { className: 'pt-toc', 'aria-label': 'On this page' },
      h('div', { className: 'pt-label' }, p.title || 'On this page'),
      h('div', { className: 'pt-toc-list' }, (p.items || []).map(function (it) {
        return h('a', { key: it.href, href: it.href, className: it.href === p.active ? 'is-on' : null }, it.label);
      })));
  }

  function ReadingProgress(p) {
    var _p = useState(p.value != null ? p.value : 0);
    useEffect(function () {
      if (p.value != null) return;
      function on() { var d = document.documentElement, m = Math.max(1, d.scrollHeight - window.innerHeight); _p[1](Math.min(1, (window.scrollY || 0) / m)); }
      window.addEventListener('scroll', on, { passive: true }); on();
      return function () { window.removeEventListener('scroll', on); };
    }, [p.value]);
    var v = p.value != null ? p.value : _p[0];
    return h('div', { className: cx('pt-progress', p.inline && 'is-inline'), style: { width: Math.round(v * 100) + '%' }, role: 'progressbar', 'aria-valuenow': Math.round(v * 100), 'aria-valuemin': 0, 'aria-valuemax': 100 });
  }

  function Prose(p) {
    if (p.html != null) return h('div', { className: cx('pt-prose', p.className), dangerouslySetInnerHTML: { __html: p.html } });
    return h('div', { className: cx('pt-prose', p.className) }, p.children);
  }

  function Callout(p) {
    var kind = p.kind || 'note';
    return h('div', { className: cx('pt-callout', kind === 'warning' && 'is-warning'), role: kind === 'warning' ? 'alert' : 'note' },
      h('span', { className: 'pt-callout-kind' }, p.label || (kind === 'warning' ? 'Warning' : 'Note')), h('span', null, p.children));
  }

  function highlight(code) {
    var re = /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")(\s*:)?|\b(-?\d+(?:\.\d+)?|true|false|null)\b/g, out = [], last = 0, m, i = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) out.push(code.slice(last, m.index));
      if (m[1]) out.push(h('span', { key: i++, className: 'tok-c' }, m[1]));
      else if (m[2]) { out.push(h('span', { key: i++, className: m[3] ? 'tok-k' : 'tok-s' }, m[2])); if (m[3]) out.push(m[3]); }
      else out.push(h('span', { key: i++, className: 'tok-n' }, m[4]));
      last = re.lastIndex;
    }
    if (last < code.length) out.push(code.slice(last));
    return out;
  }

  function CodeBlock(p) {
    var files = p.files || [{ label: p.filename, lang: p.lang, code: p.code || '' }];
    var _t = useState(0);
    var cur = files[_t[0]] || files[0];
    var head = files.length > 1
      ? h('div', { className: 'pt-code-tabs', role: 'tablist' }, files.map(function (f, i) {
          return h('button', { key: i, type: 'button', role: 'tab', 'aria-selected': i === _t[0], className: cx('pt-code-tab', i === _t[0] && 'is-on'), onClick: function () { _t[1](i); } }, f.label);
        }))
      : (cur.label || cur.lang ? h('div', { className: 'pt-code-head' }, h('span', null, cur.label), h('span', null, cur.lang)) : null);
    return h('div', { className: cx('pt-code', p.window && 'is-window') }, head,
      h('pre', null, h('code', null, p.plain ? cur.code : highlight(cur.code))));
  }

  function DataTable(p) {
    var cols = p.columns || [], tpl = p.template || ('minmax(0,1.6fr) repeat(' + Math.max(1, cols.length - 1) + ', minmax(0,0.7fr))');
    return h('div', { className: 'pt-table pt-scroll-x' },
      h('div', { className: 'pt-table-row is-head', style: { gridTemplateColumns: tpl } }, cols.map(function (c, i) { return h('span', { key: i }, c); })),
      (p.rows || []).map(function (r, ri) {
        return h('div', { key: ri, className: 'pt-table-row', style: { gridTemplateColumns: tpl } }, r.map(function (cell, ci) {
          var c = cell && typeof cell === 'object' && !React.isValidElement(cell) ? cell : { value: cell };
          return h('span', { key: ci, className: ci === 0 ? null : cx('num', c.tone === 'bad' && 'is-bad', c.tone === 'good' && 'is-good') }, c.value);
        }));
      }),
      p.note ? h('div', { className: 'pt-table-note' }, p.note) : null);
  }

  function PullQuote(p) { return h('figure', { className: 'pt-pullquote', style: { margin: 0 } }, p.children); }

  function StepList(p) {
    return h('div', { className: 'pt-steplist' }, (p.items || []).map(function (it, i) {
      return h('div', { key: i, className: 'pt-steplist-item' },
        h('span', { className: 'pt-steplist-n' }, (i < 9 ? '0' : '') + (i + 1)),
        h('span', null, h('strong', null, it.title), ' ', it.body));
    }));
  }

  function Figure(p) {
    return h('figure', { className: 'pt-figure' },
      h(MediaPlaceholder, { src: p.src, alt: p.alt, label: p.label || 'image · 16:9', ratio: p.ratio }),
      p.caption ? h('figcaption', null, p.caption) : null);
  }

  function ArticleCTA(p) {
    return h('div', { className: 'pt-cta-card' },
      h('div', null, h('div', { className: 'pt-cta-card-title' }, p.title), h('div', { className: 'pt-cta-card-body' }, p.body)),
      h(Button, { variant: 'primary', href: p.href || '#', style: { flex: 'none' } }, p.action || 'Check a site free →'));
  }

  function PostCard(p) {
    var hasStat = p.stat != null;
    var Tag_ = p.href ? 'a' : 'button';
    var top = h('div', { className: 'pt-postcard-top' }, h(Chip, null, p.category), p.readTime ? h('span', { className: 'pt-meta' }, p.readTime) : null);
    var props = { className: cx('pt-card pt-postcard', hasStat && 'has-stat'), href: p.href, onClick: p.onClick, type: p.href ? undefined : 'button' };
    if (!hasStat) return h(Tag_, props, top, h('div', { className: 'pt-postcard-title' }, p.title), p.dek ? h('p', { className: 'pt-postcard-dek' }, p.dek) : null, h('div', { className: 'pt-postcard-date' }, p.date));
    return h(Tag_, props,
      h('div', { className: 'pt-postcard-head', style: { background: p.background || grad('tile', p.index || 0) } }, h('div', { className: 'pt-stat-v' }, p.stat), h('div', { className: 'pt-stat-n' }, p.statNote)),
      h('div', { className: 'pt-postcard-body' }, top, h('div', { className: 'pt-postcard-title' }, p.title), p.dek ? h('p', { className: 'pt-postcard-dek' }, p.dek) : null, h('div', { className: 'pt-postcard-date' }, p.date)));
  }

  function FeaturedPost(p) {
    return h('a', { className: 'pt-feat-post', href: p.href || '#' },
      h('div', { className: 'pt-feat-post-media' }, h('div', { className: 'v' }, p.stat), h('div', { className: 'pt-stat-n', style: { marginTop: 8 } }, p.statNote)),
      h('div', { className: 'pt-feat-post-body' }, h('div', { className: 'pt-postcard-top' }, h(Chip, null, p.category), h('span', { className: 'pt-meta' }, p.readTime)),
        h('div', { className: 't' }, p.title), h('p', { className: 'pt-postcard-dek' }, p.dek), h('div', { className: 'pt-postcard-date' }, p.date)));
  }

  /* ---------- page blocks ---------- */

  function BlockLabel(p) {
    return h('div', { className: 'pt-blocklabel', id: p.id }, h('div', null, h('span', null, (p.n ? p.n + ' · ' : '') + p.title), h('span', { className: 'key' }, p.blockKey)));
  }

  function AnnouncementBar(p) {
    var _o = useState(true);
    if (!_o[0]) return null;
    if (p.variant === 'system') return h('div', { className: 'pt-announce is-system', role: 'status' }, h('span', { className: 'pt-dot' }), h('span', null, p.children));
    return h('div', { className: 'pt-announce' },
      p.badge === false ? null : h('span', { className: 'pt-announce-new' }, p.badge || 'New'),
      h('span', null, p.children),
      p.href ? h('a', { href: p.href }, p.linkLabel || 'Read →') : null,
      p.dismissible === false ? null : h('button', { type: 'button', className: 'pt-announce-x', 'aria-label': 'Dismiss', onClick: function () { _o[1](false); } }, '✕'));
  }

  function SiteHeader(p) {
    return h('header', { className: 'pt-header' }, h('div', { className: 'pt-header-in' },
      h('a', { href: p.homeHref || '#', style: { color: 'inherit' } }, h(Logo, { section: p.section })),
      h('nav', { className: 'pt-nav' },
        (p.links || []).map(function (l) { return h('a', { key: l.label, href: l.href || '#', className: l.active ? 'is-on' : null }, l.label); }),
        p.cta ? h(Button, { variant: 'dark', size: 'sm', href: p.cta.href || '#' }, p.cta.label) : null)));
  }

  var DOTS = ['var(--grad-dot-1)', 'var(--grad-dot-2)', 'var(--grad-dot-3)', 'var(--grad-dot-4)'];
  function NavBar(p) {
    var _m = useState(!!p.defaultOpen);
    if (p.variant === 'minimal') {
      return h('div', { className: 'pt-navshell', style: { background: 'var(--surface-raised)' } }, h('div', { className: 'pt-navshell-in' },
        h(Logo, { section: p.section }),
        h('div', { className: 'pt-nav', style: { gap: 18 } }, (p.links || []).map(function (l) { return h('a', { key: l.label, href: l.href || '#', className: l.active ? 'is-on' : null }, l.label); }),
          p.cta ? h('a', { href: p.cta.href || '#', style: { color: 'var(--link)' } }, p.cta.label) : null)));
    }
    return h('div', { className: 'pt-navshell' },
      h('div', { className: 'pt-navshell-in' },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 28 } }, h(Logo, null),
          h('nav', { className: 'pt-navmenu' },
            p.menu ? h('button', { type: 'button', 'aria-expanded': _m[0], className: _m[0] ? 'is-open' : null, onClick: function () { _m[1](!_m[0]); } }, p.menuLabel || 'Product', h('span', { style: { fontSize: 10, opacity: 0.6 } }, '▾')) : null,
            (p.links || []).map(function (l) { return h('a', { key: l.label, href: l.href || '#' }, l.label); }))),
        h('div', { className: 'pt-row', style: { gap: 10 } },
          p.signIn ? h('a', { href: '#', style: { padding: '9px 14px', fontSize: 14, color: 'var(--ink)' } }, p.signIn) : null,
          p.cta ? h(Button, { variant: 'dark', size: 'sm', href: p.cta.href || '#' }, p.cta.label) : null)),
      p.menu && _m[0] ? h('div', { className: 'pt-mega', role: 'menu' }, p.menu.map(function (m, i) {
        return h('a', { key: m.title, href: m.href || '#', role: 'menuitem' }, h('span', { className: 'pt-mega-dot', style: { background: DOTS[i % 4] } }),
          h('span', null, h('div', { className: 'pt-mega-t' }, m.title), h('div', { className: 'pt-mega-d' }, m.body)));
      })) : null);
  }

  function Actions(p) {
    if (!p.items || !p.items.length) return null;
    return h('div', { className: 'pt-row' }, p.items.map(function (a, i) {
      return h(Button, { key: i, variant: a.variant || (i === 0 ? 'primary' : 'glass'), size: a.size || p.size || 'lg', href: a.href || '#' }, a.label);
    }));
  }

  function HeroCentered(p) {
    var Hd = p.as || 'h1';
    return h('section', { className: 'pt-hero' },
      h('div', { className: 'pt-blobs', 'aria-hidden': 'true' },
        h('div', { className: 'pt-blob is-violet', style: { left: '-6%', top: -40, width: 440, height: 440 } }),
        h('div', { className: 'pt-blob is-pink', style: { right: '-4%', top: 20, width: 480, height: 480 } })),
      h('div', { className: 'pt-hero-in' },
        h(Hd, null, p.title, p.highlight ? h(F, null, ' ', h('span', { className: 'pt-grad-text' }, p.highlight)) : null),
        p.lead ? h('p', null, p.lead) : null,
        h(Actions, { items: p.actions })));
  }

  function HeroSplit(p) {
    var Hd = p.as || 'h1';
    return h('section', { className: 'pt-block pt-split', style: { paddingTop: 56 } },
      h('div', null,
        h(Hd, null, p.title), p.lead ? h('p', null, p.lead) : null,
        h('div', { className: 'pt-row' }, (p.actions || []).map(function (a, i) {
          return h(Button, { key: i, variant: a.variant || (i === 0 ? 'dark' : 'link'), size: 'md', href: a.href || '#', style: i === 0 ? { padding: '13px 24px' } : { padding: '13px 4px' } }, a.label);
        }))),
      h(MediaPlaceholder, { src: p.media, label: p.mediaLabel || 'media · 4:3 · screenshot or video' }));
  }

  function LogoStrip(p) {
    var logos = p.logos || [1, 2, 3, 4, 5, 6];
    return h('section', { className: 'pt-block' },
      h('div', { className: 'pt-logos-cap' }, p.caption || 'Watching sites for teams at'),
      h('div', { className: 'pt-logos' }, logos.map(function (l, i) {
        return h('div', { key: i, className: cx('pt-logo-tile', l && l.src && 'has-img') }, l && l.src ? h('img', { src: l.src, alt: l.alt || '' }) : 'logo');
      })));
  }

  function FeatureGrid(p) {
    return h('section', { className: 'pt-block' },
      p.title ? h('h2', { className: 'pt-h-section' }, p.title) : null,
      h('div', { className: 'pt-grid pt-grid-3', style: { marginTop: 28 } }, (p.items || []).map(function (f, i) {
        return h('div', { key: i, className: 'pt-card pt-feature' }, h('span', { className: 'pt-feature-dot', style: { background: DOTS[i % 4] } }),
          h('div', { className: 'pt-feature-t' }, f.title), h('p', { className: 'pt-feature-d' }, f.body));
      })));
  }

  function StatsRow(p) {
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-stats' }, (p.items || []).map(function (s, i) {
      return h('div', { key: i, className: 'pt-stat', style: { background: grad('tile', i) } }, h('div', { className: 'v' }, s.value), h('div', { className: 'n' }, s.note));
    })));
  }

  function Steps(p) {
    var items = p.items || [];
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-steps', style: { gridTemplateColumns: 'repeat(' + items.length + ', minmax(0,1fr))' } }, items.map(function (s, i) {
      return h('div', { key: i, className: 'pt-step' }, h('span', { className: 'pt-step-n', style: { background: DOTS[i % 4] } }, '0' + (i + 1)),
        h('div', { className: 'pt-step-t' }, s.title), h('p', { className: 'pt-step-d' }, s.body));
    })));
  }

  function TabsMedia(p) {
    var tabs = p.tabs || [], _t = useState(0), t = tabs[_t[0]] || {};
    return h('section', { className: 'pt-block pt-tabsmedia' },
      h(SegmentedControl, { options: tabs.map(function (x, i) { return { label: x.label, value: i }; }), value: _t[0], onChange: _t[1] }),
      h('div', { className: 'pt-tabsmedia-body' },
        h('div', null, h('div', { className: 'pt-tabsmedia-t' }, t.title), h('p', { className: 'pt-tabsmedia-d' }, t.body)),
        h(MediaPlaceholder, { src: t.media, label: t.mediaLabel || 'media', background: grad('tile', _t[0]) })));
  }

  function CodeShowcase(p) {
    var _c = useState(false);
    return h('section', { className: 'pt-block pt-codesplit' },
      h('div', null, h('h2', { className: 'pt-h-block' }, p.title), h('p', null, p.body),
        h(Button, { variant: 'secondary', size: 'sm', style: { marginTop: 22, padding: '11px 20px' }, onClick: function () {
          try { navigator.clipboard.writeText((p.files || [])[0].code); } catch (e) {} _c[1](true);
        } }, _c[0] ? 'Copied ✓' : (p.copyLabel || 'Copy snippet'))),
      h(CodeBlock, { files: p.files, window: true }));
  }

  function Gallery(p) {
    var items = p.items || [], _lb = useState(-1), cur = items[_lb[0]];
    return h('section', { className: 'pt-block', style: { position: 'relative' } },
      h('div', { className: 'pt-gallery' }, items.map(function (g, i) {
        var sp = {}; if (g.span === 'big') { sp.gridColumn = 'span 2'; sp.gridRow = 'span 2'; } if (g.span === 'wide') sp.gridColumn = 'span 2'; if (g.span === 'tall') sp.gridRow = 'span 2';
        return h('button', { key: i, type: 'button', className: 'pt-gallery-tile', style: Object.assign({ background: grad('tile', i) }, sp), onClick: function () { _lb[1](i); } },
          g.src ? h('img', { src: g.src, alt: g.caption || '' }) : g.label);
      })),
      p.hint ? h('div', { style: { marginTop: 12, fontSize: 13, color: 'var(--ink-muted)' } }, p.hint) : null,
      cur ? h('div', { className: cx('pt-lightbox', p.inlineLightbox && 'is-inline'), role: 'dialog', 'aria-label': cur.caption, onClick: function () { _lb[1](-1); } },
        h('div', { className: 'pt-lightbox-card', onClick: function (e) { e.stopPropagation(); } },
          h('div', { className: 'pt-lightbox-media', style: { background: grad('tile', _lb[0]) } }, cur.src ? h('img', { src: cur.src, alt: cur.caption, style: { width: '100%', height: '100%', objectFit: 'cover' } }) : cur.label),
          h('div', { className: 'pt-lightbox-foot' }, h('span', null, cur.caption), h('div', { className: 'pt-row', style: { gap: 8 } },
            h(IconButton, { label: 'Previous', onClick: function () { _lb[1]((_lb[0] + items.length - 1) % items.length); } }, '←'),
            h(IconButton, { label: 'Next', onClick: function () { _lb[1]((_lb[0] + 1) % items.length); } }, '→'),
            h(IconButton, { label: 'Close', onClick: function () { _lb[1](-1); } }, '✕'))))) : null);
  }

  function CardSlider(p) {
    var items = p.items || [], per = p.perView || 3, max = Math.max(0, items.length - per), _s = useState(0), s = _s[0];
    return h('section', { className: 'pt-block' },
      h('div', { className: 'pt-block-head' }, h('h2', { className: 'pt-h-block' }, p.title),
        h('div', { className: 'pt-row', style: { gap: 8 } },
          h(IconButton, { label: 'Previous', disabled: s === 0, onClick: function () { _s[1](Math.max(0, s - 1)); } }, '←'),
          h(IconButton, { label: 'Next', disabled: s === max, onClick: function () { _s[1](Math.min(max, s + 1)); } }, '→'))),
      h('div', { className: 'pt-slider-view' }, h('div', { className: 'pt-slider-track', style: { transform: 'translateX(calc(' + (-s) + ' * ((100% - 40px) / 3 + 20px)))' } },
        items.map(function (c, i) {
          return h('div', { key: i, className: 'pt-card', style: { overflow: 'hidden' } },
            h('div', { style: { padding: 22, background: grad('tile', i) } }, h('div', { className: 'pt-stat-v' }, c.stat), h('div', { className: 'pt-stat-n' }, c.note)),
            h('div', { style: { padding: '20px 22px 22px', fontSize: 17, lineHeight: 1.3, fontWeight: 600, letterSpacing: '-0.015em' } }, c.title));
        }))),
      h('div', { className: 'pt-dots' }, Array.from({ length: max + 1 }, function (_, i) {
        return h('button', { key: i, type: 'button', 'aria-label': 'Slide ' + (i + 1), className: i === s ? 'is-on' : null, onClick: function () { _s[1](i); } });
      })));
  }

  function ReviewsGrid(p) {
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-grid pt-grid-3', style: { alignItems: 'start' } }, (p.items || []).map(function (r, i) {
      return h('figure', { key: i, className: 'pt-card pt-review' },
        h('div', { className: 'pt-stars', 'aria-label': (r.rating || 5) + ' out of 5' }, '★★★★★'.slice(0, r.rating || 5)),
        h('blockquote', null, r.text),
        h('figcaption', null, h('span', { className: 'pt-avatar is-sm', style: { background: DOTS[i % 4] }, 'aria-hidden': 'true' }),
          h('div', null, h('div', { className: 'name' }, r.name), h('div', { className: 'role' }, r.role))));
    })));
  }

  function TestimonialSpotlight(p) {
    var items = p.items || [], _q = useState(0), q = items[_q[0]] || {};
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-spot' },
      h('div', { className: 'pt-spot-glow', 'aria-hidden': 'true' }),
      h('blockquote', null, q.text),
      h('div', { className: 'pt-spot-foot' }, h('div', null, q.name, ' · ', q.role),
        items.length > 1 ? h('div', { className: 'pt-row', style: { gap: 8 } },
          h(IconButton, { glass: true, label: 'Previous', onClick: function () { _q[1]((_q[0] + items.length - 1) % items.length); } }, '←'),
          h(IconButton, { glass: true, label: 'Next', onClick: function () { _q[1]((_q[0] + 1) % items.length); } }, '→')) : null)));
  }

  function PricingTiers(p) {
    var _y = useState(false), yearly = _y[0], disc = p.yearlyDiscount != null ? p.yearlyDiscount : 0.2;
    return h('section', { className: 'pt-block' },
      h('div', { className: 'pt-block-head' }, h('h2', { className: 'pt-h-block' }, p.title),
        h(SegmentedControl, { options: [{ label: 'Monthly', value: 0 }, { label: p.yearlyLabel || 'Yearly · −20%', value: 1 }], value: yearly ? 1 : 0, onChange: function (v) { _y[1](v === 1); } })),
      h('div', { className: 'pt-tiers' }, (p.tiers || []).map(function (t, i) {
        var price = typeof t.price === 'number' ? '$' + (yearly ? Math.round(t.price * (1 - disc)) : t.price) : t.price;
        return h('div', { key: i, className: cx('pt-tier', t.featured && 'is-featured') },
          h('div', { className: 'pt-tier-top' }, h('span', { className: 'pt-tier-name' }, t.name), t.badge ? h(Chip, { tone: 'featured' }, t.badge) : null),
          h('div', { className: 'pt-tier-price' }, h('span', { className: 'v' }, price), t.per ? h('span', { className: 'per' }, t.per) : null),
          h('div', { className: 'pt-tier-sub' }, t.sub),
          h('div', { className: 'pt-tier-list' }, (t.features || []).map(function (f, j) { return h('div', { key: j, className: 'pt-tier-item' }, h('span', { className: 'ck', 'aria-hidden': 'true' }, '✓'), h('span', null, f)); })),
          h(Button, { variant: t.featured ? 'primary' : 'soft', block: true, href: t.href || '#' }, t.cta));
      })));
  }

  function tone(v) { return v === 'Yes' ? 'v-yes' : (v === 'No' || v === '—') ? 'v-no' : 'v-mid'; }
  function ComparisonTable(p) {
    var cols = p.columns || [], tpl = 'minmax(0,1.4fr) repeat(' + (cols.length - 1) + ', minmax(0,1fr))';
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-card pt-scroll-x', style: { overflow: 'hidden' } },
      h('div', { className: 'pt-compare-row is-head', style: { gridTemplateColumns: tpl } }, cols.map(function (c, i) { return h('span', { key: i, className: i === 1 ? 'is-us' : null }, c); })),
      (p.rows || []).map(function (r, ri) {
        return h('div', { key: ri, className: 'pt-compare-row', style: { gridTemplateColumns: tpl } }, r.map(function (v, i) {
          return h('span', { key: i, className: cx(i === 1 && 'is-us', i > 0 && tone(v)) }, v);
        }));
      })));
  }

  function FAQ(p) {
    var _o = useState(p.defaultOpen != null ? p.defaultOpen : 0);
    return h('section', { className: 'pt-block pt-faq' },
      h('div', null, h('h2', { className: 'pt-h-block' }, p.title), p.sub ? h('p', { className: 'pt-sub' }, p.sub) : null),
      h('div', null, (p.items || []).map(function (f, i) {
        var open = _o[0] === i;
        return h('div', { key: i, className: cx('pt-faq-item', open && 'is-open') },
          h('button', { type: 'button', className: 'pt-faq-q', 'aria-expanded': open, onClick: function () { _o[1](open ? -1 : i); } }, h('span', null, f.q), h('span', { className: 'pt-faq-icon', 'aria-hidden': 'true' }, '+')),
          open ? h('p', { className: 'pt-faq-a' }, f.a) : null);
      })));
  }

  function LatestPosts(p) {
    return h('section', { className: 'pt-block' },
      h('div', { className: 'pt-block-head', style: { alignItems: 'baseline' } }, h('h2', { className: 'pt-h-block' }, p.title || 'Latest writing'), p.allHref ? h('a', { href: p.allHref, style: { fontSize: 15 } }, p.allLabel || 'All posts →') : null),
      h('div', { className: 'pt-grid pt-grid-3', style: { marginTop: 24 } }, (p.posts || []).map(function (x, i) { return h(PostCard, Object.assign({ key: i, href: x.href || '#' }, x)); })));
  }

  function Newsletter(p) {
    return h('section', { className: 'pt-block' }, h('div', { className: 'pt-news' },
      h('div', null, h('div', { className: 'pt-news-t' }, p.title), p.body ? h('p', null, p.body) : null),
      h(InlineForm, { action: p.action || 'Subscribe', onSubmit: p.onSubmit })));
  }

  function ContactForm(p) {
    var _s = useState(false);
    return h('section', { className: 'pt-block pt-contact' },
      h('div', null, h('h2', { className: 'pt-h-block' }, p.title), p.body ? h('p', { className: 'pt-sub' }, p.body) : null,
        p.meta ? h('div', { className: 'pt-contact-meta' }, p.meta.map(function (m, i) { return h('span', { key: i }, m); })) : null),
      _s[0] ? h('div', { className: 'pt-card pt-form-done', role: 'status' }, h('div', { className: 't' }, p.doneTitle || 'Message sent ✓'), h('div', { className: 'd' }, p.doneBody || 'We reply within a working day.'))
        : h('form', { className: 'pt-card pt-form', onSubmit: function (e) { e.preventDefault(); _s[1](true); p.onSubmit && p.onSubmit(); } },
          (p.fields || []).map(function (f, i) { return h(Field, Object.assign({ key: i }, f)); }),
          h(Button, { variant: 'primary', type: 'submit', style: { padding: '13px 24px' } }, p.action || 'Send message')));
  }

  function CTABanner(p) {
    return h('section', { className: 'pt-ctabanner' }, h('div', { className: 'pt-ctabanner-glow', 'aria-hidden': 'true' }),
      h('div', { className: 'pt-ctabanner-in' }, h('h2', null, p.title), h(Actions, { items: p.actions, size: 'xl' })));
  }

  function Footer(p) {
    if (p.variant === 'simple') {
      return h('footer', { className: 'pt-footer-simple' }, h('div', { className: 'pt-footer-simple-in' },
        h('div', { className: 'pt-logo is-sm' }, h('span', { className: 'pt-logo-mark' }), h('span', { className: 'pt-logo-word' }, p.copyright || 'potato © 2026')),
        h('div', { className: 'pt-row', style: { gap: 20 } }, (p.links || []).map(function (l) { return h('a', { key: l.label, href: l.href || '#' }, l.label); })),
        p.note ? h('div', { className: 'pt-note' }, p.note) : null));
    }
    return h('footer', { className: 'pt-footer' },
      h('div', { className: 'pt-footer-grid' },
        h('div', null, h(Logo, null), p.tagline ? h('p', { className: 'pt-footer-tag' }, p.tagline) : null),
        (p.columns || []).map(function (c) {
          return h('div', { key: c.title }, h('div', { className: 'pt-label' }, c.title), h('div', { className: 'pt-footer-links' }, c.links.map(function (l) { return h('a', { key: l, href: '#' }, l); })));
        })),
      h('div', { className: 'pt-footer-base' }, h('span', null, p.copyright || 'potato © 2026'), p.note ? h('span', { className: 'pt-note' }, p.note) : null));
  }

  function BentoGrid(p) {
    return h('section', { className: 'pt-block' },
      p.title ? h('h2', { className: 'pt-h-section' }, p.title) : null,
      h('div', { className: 'pt-bento' }, (p.tiles || []).map(function (t, i) {
        var cls = cx('pt-bento-tile', t.size === 'big' && 'w2 h2 big', t.size === 'wide' && 'w2', t.tone === 'dark' && 'is-dark', t.tone && t.tone.indexOf('tint') === 0 && 'is-tint');
        var bg = t.tone && t.tone.indexOf('tint') === 0 ? { background: grad('tile', parseInt(t.tone.slice(4), 10) - 1 || 0) } : null;
        var body = [];
        if (t.title) body.push(h('div', { key: 't', className: 'pt-bento-title' }, t.title));
        if (t.value) body.push(h('div', { key: 'v' }, h('div', { className: 'pt-bento-v' }, t.value), h('div', { className: 'pt-bento-n' }, t.note)));
        if (t.text) body.push(h('div', { key: 'x', style: { fontSize: t.tone === 'dark' ? 16 : 17, lineHeight: t.tone === 'dark' ? 1.5 : 1.35, fontWeight: t.tone === 'dark' ? 400 : 600, letterSpacing: t.tone === 'dark' ? 0 : '-0.015em' } }, t.text));
        if (t.diffs) body.push(h('div', { key: 'd', className: 'pt-diffs' }, t.diffs.map(function (d, j) { return h('div', { key: j, className: 'pt-diff is-' + d.kind }, h('span', { className: 'f' }, d.file), h('span', { className: 'c' }, d.cost)); })));
        if (t.tags) body.push(h('div', { key: 'g', className: 'pt-tags', style: { gap: 6 } }, t.tags.map(function (g, j) { return h(Tag, { key: j, size: 'sm', tone: g.tone }, g.label || g); })));
        if (t.bars) body.push(h('div', { key: 'b', style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 } },
          h('div', { className: 'pt-bento-n', style: { fontSize: 15 } }, t.note),
          h('div', { className: 'pt-bars', 'aria-hidden': 'true' }, t.bars.map(function (v, j) { return h('span', { key: j, className: v > (t.limit || 2.5) ? 'is-over' : null, style: { height: Math.round(v / (t.max || 4) * 70) } }); }))));
        return h('div', { key: i, className: cls, style: bg },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12 } }, h('div', { className: cx('pt-bento-k', t.accent && 'is-accent') }, t.label), t.aside ? h('span', { className: 'pt-note', style: { color: 'var(--code-comment)' } }, t.aside) : null),
          body);
      })));
  }

  function VideoDemo(p) {
    var ch = p.chapters || [], _c = useState(0), _p = useState(false), pos = ch[_c[0]] ? ch[_c[0]].at : 0;
    return h('section', { className: 'pt-block pt-video' },
      h('div', { className: 'pt-player' },
        h('button', { type: 'button', className: 'pt-player-screen', 'aria-label': _p[0] ? 'Pause' : 'Play', onClick: function () { _p[1](!_p[0]); } },
          h('span', { className: 'lbl' }, p.label || 'video · 16:9'), h('span', { className: cx('pt-play', _p[0] && 'is-playing') }, _p[0] ? '❚❚' : '▶')),
        h('div', { className: 'pt-player-bar' }, h('span', { className: 'now' }, ch[_c[0]] ? ch[_c[0]].t : '0:00'), h('div', { className: 'pt-track' }, h('div', { style: { width: Math.max(2, pos || 0) + '%' } })), h('span', null, p.duration))),
      h('div', null, h('h2', { className: 'pt-h-block', style: { fontSize: 30, lineHeight: 1.15, letterSpacing: '-0.03em' } }, p.title), p.body ? h('p', { className: 'pt-sub', style: { marginTop: 12 } }, p.body) : null,
        h('div', { className: 'pt-chapters' }, ch.map(function (c, i) {
          return h('button', { key: i, type: 'button', className: cx('pt-chapter', i === _c[0] && 'is-on'), onClick: function () { _c[1](i); _p[1](true); } }, h('span', { className: 't' }, c.t), h('span', null, c.label));
        }))));
  }

  function Timeline(p) {
    var items = p.items || [];
    return h('section', { className: 'pt-block pt-contact' },
      h('div', null, h('h2', { className: 'pt-h-block' }, p.title), p.sub ? h('p', { className: 'pt-sub' }, p.sub) : null),
      h('div', { className: 'pt-timeline' }, h('div', { className: 'pt-timeline-rail', 'aria-hidden': 'true' }), items.map(function (t, i) {
        var next = t.upcoming || i === items.length - 1 && p.lastIsNext !== false;
        return h('div', { key: i, className: 'pt-tl-item' }, h('span', { className: cx('pt-tl-dot', next && 'is-next'), style: next ? null : { background: DOTS[i % 4] } }),
          h('div', { className: 'pt-tl-date' }, t.date), h('div', { className: 'pt-tl-t' }, t.title), h('p', { className: 'pt-tl-d' }, t.body));
      })));
  }

  function CareersList(p) {
    var jobs = p.jobs || [], depts = ['All'].concat(jobs.map(function (j) { return j.dept; }).filter(function (d, i, a) { return a.indexOf(d) === i; }));
    var _d = useState('All'), list = _d[0] === 'All' ? jobs : jobs.filter(function (j) { return j.dept === _d[0]; });
    return h('section', { className: 'pt-block' },
      h('div', { className: 'pt-block-head' }, h('h2', { className: 'pt-h-block' }, p.title || 'Open roles'), h(SegmentedControl, { options: depts, value: _d[0], onChange: _d[1] })),
      h('div', { className: 'pt-card pt-jobs', style: { overflow: 'hidden' } }, list.length ? list.map(function (j, i) {
        return h('a', { key: i, href: j.href || '#', className: 'pt-job' }, h('span', null, h('span', { className: 't' }, j.title), h('span', { className: 'd' }, j.dept)),
          h('span', { className: 'm' }, j.location), h('span', { className: 'm' }, j.type), h('span', { className: 'go' }, 'Apply →'));
      }) : h('div', { className: 'pt-empty' }, p.emptyText || 'No open roles here right now.')));
  }

  function EventsGrid(p) {
    var _r = useState({});
    return h('section', { className: 'pt-block' }, h('h2', { className: 'pt-h-block' }, p.title || 'Upcoming sessions'),
      h('div', { className: 'pt-grid pt-grid-3', style: { marginTop: 24 } }, (p.events || []).map(function (e, i) {
        var on = !!_r[0][i];
        return h('div', { key: i, className: 'pt-card pt-event' },
          h('div', { className: 'pt-event-head', style: { background: grad('tile', i) } },
            h('div', { className: 'pt-datetile' }, h('div', { className: 'm' }, e.month), h('div', { className: 'd' }, e.day)),
            h('div', null, h('div', { className: 'pt-event-kind' }, e.kind), h('div', { className: 'pt-event-when' }, e.when))),
          h('div', { className: 'pt-event-body' }, h('div', { className: 't' }, e.title), h('div', { className: 'd' }, e.body),
            h(Button, { variant: on ? 'success' : 'secondary', onClick: function () { var n = Object.assign({}, _r[0]); n[i] = !on; _r[1](n); } }, on ? 'Registered ✓' : 'Register')));
      })));
  }

  function CookieConsent(p) {
    var _st = useState('open'), _set = useState(false), _pr = useState([true, false]);
    var prefs = p.preferences || [{ name: 'Essential', note: 'Sign-in and security. Always on.', locked: true }, { name: 'Analytics', note: 'Which pages get read. Self-hosted, no third party.' }];
    var banner = _st[0] !== 'open' ? null : h('div', { className: cx('pt-cookie', p.fixed && 'is-fixed'), role: 'dialog', 'aria-label': p.title || 'Cookies' },
      h('div', { className: 'pt-cookie-t' }, p.title || 'Cookies, briefly'), h('p', null, p.body),
      _set[0] ? h('div', { className: 'pt-cookie-prefs' }, prefs.map(function (c, i) {
        return h('div', { key: i, className: 'pt-cookie-pref' }, h('div', null, h('div', { className: 'n' }, c.name), h('div', { className: 'd' }, c.note)),
          h(Switch, { label: c.name, checked: _pr[0][i], locked: c.locked, onChange: function (v) { var n = _pr[0].slice(); n[i] = v; _pr[1](n); } }));
      })) : null,
      h('div', { className: 'pt-row' },
        h(Button, { variant: 'dark', onClick: function () { _st[1](_set[0] ? 'saved' : 'accepted'); } }, _set[0] ? 'Save choices' : 'Accept'),
        h(Button, { variant: 'secondary', onClick: function () { _st[1]('rejected'); }, style: { fontWeight: 400 } }, 'Reject'),
        h(Button, { variant: 'link', onClick: function () { _set[1](!_set[0]); } }, _set[0] ? 'Hide settings' : 'Settings')));
    if (p.fixed) return banner;
    return h('div', { className: 'pt-cookie-stage' },
      h('div', { 'aria-hidden': 'true', style: { position: 'absolute', left: 28, top: 28, right: 28, display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.5 } },
        h('div', { style: { height: 14, width: '40%', borderRadius: 999, background: 'var(--line)' } }),
        h('div', { style: { height: 10, width: '70%', borderRadius: 999, background: 'var(--line-faint)' } }),
        h('div', { style: { height: 10, width: '60%', borderRadius: 999, background: 'var(--line-faint)' } })),
      _st[0] === 'open' ? null :h('div', { style: { position: 'absolute', left: 28, top: 96, fontSize: 14, color: 'var(--ink-secondary)' } },
        _st[0] === 'accepted' ? 'Accepted: analytics on' : _st[0] === 'rejected' ? 'Rejected: essential only' : 'Saved: analytics ' + (_pr[0][1] ? 'on' : 'off'), ' · ',
        h('a', { href: '#', onClick: function (e) { e.preventDefault(); _st[1]('open'); _set[1](false); } }, 'show again')),
      banner);
  }

  function ErrorPage(p) {
    return h('div', { className: 'pt-state is-error' }, h('div', { className: 'pt-state-glow', 'aria-hidden': 'true' }),
      h('div', { className: 'pt-state-in' }, h('div', { className: 'pt-404 pt-grad-text' }, p.code || '404'),
        h('div', { className: 'pt-state-t' }, p.title || 'This page moved, or never shipped'), p.body ? h('p', null, p.body) : null,
        h('div', { className: 'pt-row' }, (p.links || []).map(function (l, i) { return h(Button, { key: i, variant: i === 0 ? 'dark' : 'secondary', href: l.href || '#', style: i ? { fontWeight: 400 } : null }, l.label); })),
        p.trace ? h('div', { className: 'pt-state-foot' }, p.trace) : null));
  }

  function ComingSoon(p) {
    return h('div', { className: 'pt-state is-soon' }, h('div', { className: 'pt-state-glow', 'aria-hidden': 'true' }),
      h('div', { className: 'pt-state-in' },
        h('div', { className: 'pt-state-t' }, p.title), p.body ? h('p', null, p.body) : null,
        p.countdown ? h('div', { className: 'pt-countdown' }, p.countdown.map(function (c, i) { return h('div', { key: i }, h('div', { className: 'v' }, c.value), h('div', { className: 'l' }, c.label)); })) : null,
        h(InlineForm, { size: 'sm', action: p.action || 'Notify me', doneLabel: 'On the list ✓' })));
  }

  var Potato = {
    Logo: Logo, Button: Button, IconButton: IconButton, SegmentedControl: SegmentedControl, FilterPills: FilterPills, Chip: Chip, Tag: Tag,
    Field: Field, InlineForm: InlineForm, Switch: Switch, MediaPlaceholder: MediaPlaceholder,
    Breadcrumb: Breadcrumb, ArticleHeader: ArticleHeader, TableOfContents: TableOfContents, ReadingProgress: ReadingProgress, Prose: Prose, Callout: Callout,
    CodeBlock: CodeBlock, DataTable: DataTable, PullQuote: PullQuote, StepList: StepList, Figure: Figure, ArticleCTA: ArticleCTA, PostCard: PostCard, FeaturedPost: FeaturedPost,
    BlockLabel: BlockLabel, AnnouncementBar: AnnouncementBar, SiteHeader: SiteHeader, NavBar: NavBar, HeroCentered: HeroCentered, HeroSplit: HeroSplit, LogoStrip: LogoStrip,
    FeatureGrid: FeatureGrid, StatsRow: StatsRow, Steps: Steps, TabsMedia: TabsMedia, CodeShowcase: CodeShowcase, Gallery: Gallery, CardSlider: CardSlider,
    ReviewsGrid: ReviewsGrid, TestimonialSpotlight: TestimonialSpotlight, PricingTiers: PricingTiers, ComparisonTable: ComparisonTable, FAQ: FAQ, LatestPosts: LatestPosts,
    Newsletter: Newsletter, ContactForm: ContactForm, CTABanner: CTABanner, Footer: Footer, BentoGrid: BentoGrid, VideoDemo: VideoDemo, Timeline: Timeline,
    CareersList: CareersList, EventsGrid: EventsGrid, CookieConsent: CookieConsent, ErrorPage: ErrorPage, ComingSoon: ComingSoon
  };
  window.Potato = Object.assign(window.Potato || {}, Potato);
})();
