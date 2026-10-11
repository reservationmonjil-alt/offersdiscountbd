'use strict';
const fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'dist');
const rd = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
const S = rd('settings.json');
const PR = rd('products.json').items || [], CR = rd('courses.json').items || [];
const PO = (rd('posts.json').items || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
const PG = rd('pages.json').items || [];
const SITE = (process.env.URL || S.siteUrl || '').replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);

/* ---------- helpers ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const taka = n => '৳' + bn(Number(n).toLocaleString('en-IN'));
const okSlug = s => /^[a-z0-9-]+$/.test(s || '');
const fixSlugs = (arr, pre) => arr.forEach((x, i) => { x._s = okSlug(x.slug) ? x.slug : pre + '-' + (i + 1); });
fixSlugs(PR, 'product'); fixSlugs(CR, 'course'); fixSlugs(PO, 'post');
PG.forEach(p => { p._s = okSlug(p.slug) ? p.slug : 'page'; });
const CAT = Object.fromEntries(S.categories.map(c => [c.slug, c]));
const PBY = Object.fromEntries(PR.map(p => [p._s, p]));
const abs = u => (/^https?:\/\//i.test(u) ? u : SITE + u);
const safeUrl = u => (/^(https?:\/\/|\/|#|mailto:)/i.test(u || '') ? u : '#');
const dateBn = iso => { const d = new Date(iso); return isNaN(d) ? '' : bn(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })); };
const imgs = x => (x.images || []).filter(Boolean);
const mainImg = x => imgs(x)[0] || '/assets/placeholder.svg';
const off = p => (p.oldPrice && p.price && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const color = c => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#F85606');
const trunc = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };

const ICONS = {
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  tv: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  shirt: '<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 01-8 0z"/>',
  bag: '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/>',
  toy: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a3 3 0 00-5 1.5c0 3 5 2 5 5a3 3 0 01-5 1.5M12 6v2M12 16v2"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h13"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  up: '<path d="M6 15l6-6 6 6"/>'
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ICONS.tag}</svg>`;
const stars = r => `<span class="st" style="--r:${Math.max(0, Math.min(5, r)) / 5 * 100}%" role="img" aria-label="রেটিং ${bn(r)} / ৫">★★★★★</span>`;

function md(text) {
  const inl = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${esc(safeUrl(u.replace(/&amp;/g, '&')))}">${t}</a>`);
  const toc = []; let h = 0;
  const html = String(text || '').split(/\n{2,}/).map(b => {
    b = b.trim(); if (!b) return '';
    if (b.startsWith('## ')) { const id = 'h' + (++h); toc.push({ id, t: b.slice(3) }); return `<h2 id="${id}">${inl(b.slice(3))}</h2>`; }
    if (b.startsWith('### ')) return `<h3>${inl(b.slice(4))}</h3>`;
    const lines = b.split('\n');
    if (lines.every(l => l.trim().startsWith('- '))) return '<ul>' + lines.map(l => `<li>${inl(l.trim().slice(2))}</li>`).join('') + '</ul>';
    return `<p>${lines.map(inl).join('<br>')}</p>`;
  }).join('\n');
  return { html, toc };
}

const files = new Map();
const put = (p, c) => files.set(p, c);

/* ---------- layout ---------- */
function head({ title, desc, path: pth, type = 'website', image, noindex, extra = '' }) {
  const full = pth === '/' ? S.name + ' | ' + S.tagline : title + ' | ' + S.name;
  const url = SITE + pth;
  return `<!DOCTYPE html>
<html lang="bn"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(trunc(desc, 158))}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${esc(url)}">
${S.googleVerification ? `<meta name="google-site-verification" content="${esc(S.googleVerification)}">` : ''}
${S.bingVerification ? `<meta name="msvalidate.01" content="${esc(S.bingVerification)}">` : ''}
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:locale" content="bn_BD">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(trunc(desc, 200))}">
<meta property="og:url" content="${esc(url)}">
${image && !/\.svg$/i.test(image) ? `<meta property="og:image" content="${esc(abs(image))}">` : ''}
<meta name="twitter:card" content="${image && !/\.svg$/i.test(image) ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="#F85606">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
${extra}
${S.analyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(S.analyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(S.analyticsId)}');</script>` : ''}
</head>`;
}

function header() {
  const n = S.notice || {};
  return `<a class="skip" href="#main">মূল কনটেন্টে যান</a>
<div class="top"><div class="w top-in"><span>${esc(S.tagline)}</span><nav aria-label="উপরের মেনু"><a href="/about/">আমাদের সম্পর্কে</a><a href="/disclosure/">অ্যাফিলিয়েট নীতি</a><a href="/contact/">যোগাযোগ</a></nav></div></div>
${n.enabled && n.text ? `<div class="notice" id="notice"><div class="w notice-in"><span>${esc(n.text)}${n.link ? ` <a href="${esc(safeUrl(n.link))}">${esc(n.linkText || 'বিস্তারিত')}</a>` : ''}</span><button type="button" class="notice-x" aria-label="নোটিশ বন্ধ করুন">&times;</button></div></div>` : ''}
<header class="hd"><div class="w hd-in">
<button class="burger" type="button" aria-label="ক্যাটাগরি মেনু খুলুন" data-drawer>${ic('menu')}</button>
<a class="logo" href="/" aria-label="${esc(S.name)} হোম"><span class="logo-m">${ic('tag')}</span><span>${esc(S.name)}</span></a>
<form class="hs" action="/search/" method="get" role="search"><label class="sr" for="hq">খুঁজুন</label>
<input id="hq" name="q" type="search" placeholder="প্রোডাক্ট, কোর্স বা ব্লগ খুঁজুন" autocomplete="off"><button type="submit" aria-label="খুঁজুন">${ic('search')}</button><div class="sug" id="sug" hidden></div></form>
<nav class="hl" aria-label="প্রধান লিংক"><a href="/deals/">সব ডিল</a><a href="/courses/">কোর্স</a><a href="/blog/">ব্লগ</a></nav>
</div></header>
<nav class="cn" aria-label="ক্যাটাগরি"><div class="w cn-in">${S.categories.map(c => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join('')}</div></nav>
<div class="drawer" id="drawer" hidden><div class="drawer-bg" data-drawer></div><div class="drawer-p"><div class="drawer-h"><strong>ক্যাটাগরি</strong><button type="button" data-drawer aria-label="বন্ধ করুন">&times;</button></div>
<ul>${S.categories.map(c => `<li><a href="/category/${c.slug}/">${ic(c.icon)}<span>${esc(c.name)}</span></a></li>`).join('')}<li><a href="/courses/">${ic('book')}<span>অনলাইন কোর্স</span></a></li><li><a href="/blog/">${ic('book')}<span>ব্লগ</span></a></li></ul></div></div>`;
}

function footer() {
  return `<footer class="ft"><div class="w ft-in">
<div class="ft-c ft-about"><a class="logo logo-w" href="/"><span class="logo-m">${ic('tag')}</span><span>${esc(S.name)}</span></a>
<p>${esc(S.tagline)}। আমরা প্রোডাক্ট ও কোর্স বাছাই করি, কেনাকাটা হয় সংশ্লিষ্ট প্ল্যাটফর্মে।</p>
<div class="soc">${S.facebook ? `<a href="${esc(S.facebook)}" target="_blank" rel="noopener">Facebook</a>` : ''}${S.youtube ? `<a href="${esc(S.youtube)}" target="_blank" rel="noopener">YouTube</a>` : ''}</div></div>
<div class="ft-c"><h3>ক্যাটাগরি</h3><ul>${S.categories.slice(0, 6).map(c => `<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></div>
<div class="ft-c"><h3>সাইট</h3><ul><li><a href="/deals/">সব ডিল</a></li><li><a href="/courses/">কোর্স</a></li><li><a href="/blog/">ব্লগ</a></li><li><a href="/about/">আমাদের সম্পর্কে</a></li><li><a href="/contact/">যোগাযোগ</a></li><li><a href="/disclosure/">অ্যাফিলিয়েট নীতি</a></li><li><a href="/privacy/">গোপনীয়তা নীতি</a></li></ul></div>
<div class="ft-c"><h3>অফারের খবর পান</h3>
<form name="newsletter" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="nl" id="nl"><input type="hidden" name="form-name" value="newsletter"><p class="sr"><label>পূরণ করবেন না <input name="bot-field"></label></p>
<label class="sr" for="nle">ইমেইল</label><input id="nle" name="email" type="email" required placeholder="আপনার ইমেইল"><button type="submit">সাবস্ক্রাইব</button><p class="nl-m" role="status"></p></form></div>
</div>
<div class="ft-d"><div class="w"><p><strong>অ্যাফিলিয়েট ডিসক্লোজার:</strong> এই সাইটের কিছু লিংক অ্যাফিলিয়েট লিংক। ওই লিংকে কেনাকাটা করলে আমরা কমিশন পেতে পারি, আপনার দাম বাড়ে না। ${esc(S.name)} Daraz বা অন্য কোনো প্ল্যাটফর্মের অফিসিয়াল সাইট নয়। দাম ও অফার বদলাতে পারে, চূড়ান্ত তথ্য প্ল্যাটফর্মে দেখে নিন।</p></div></div>
<div class="ft-b"><div class="w">© ${bn(new Date().getFullYear())} ${esc(S.name)}। সর্বস্বত্ব সংরক্ষিত।</div></div></footer>
<button class="totop" type="button" aria-label="উপরে যান" hidden>${ic('up')}</button>
<script src="/assets/app.js" defer></script></body></html>`;
}

const page = (meta, body) => head(meta) + '\n<body>' + header() + `<main id="main">${body}</main>` + footer();
const crumbs = (list) => `<nav class="bc w" aria-label="ব্রেডক্রাম্ব"><ol>${list.map((c, i) => i < list.length - 1 ? `<li><a href="${c[1]}">${esc(c[0])}</a></li>` : `<li aria-current="page">${esc(c[0])}</li>`).join('')}</ol></nav>`;
const crumbLd = list => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: SITE + c[1] })) });

/* ---------- cards ---------- */
function pcard(p, hidden) {
  const o = off(p);
  return `<a class="pc${hidden ? ' hid' : ''}" href="/product/${p._s}/" data-price="${p.price}" data-off="${o}" data-rating="${p.rating || 0}" data-t="${esc(p.title)}">
<div class="pc-i"><img src="${esc(mainImg(p))}" alt="${esc(p.title)}" width="300" height="300" loading="lazy">${o ? `<span class="pc-o">-${bn(o)}%</span>` : ''}</div>
<div class="pc-b"><h3 class="pc-t">${esc(p.title)}</h3><div class="pc-p">${taka(p.price)}</div>${p.oldPrice ? `<div class="pc-w"><s>${taka(p.oldPrice)}</s></div>` : ''}${p.rating ? `<div class="pc-r">${stars(p.rating)}<span>${bn(p.rating)}</span></div>` : ''}</div></a>`;
}
function ccard(c) {
  const o = off(c);
  return `<a class="pc cc" href="/course/${c._s}/"><div class="pc-i cc-i"><img src="${esc(mainImg(c))}" alt="${esc(c.title)}" width="300" height="300" loading="lazy">${o ? `<span class="pc-o">-${bn(o)}%</span>` : ''}</div>
<div class="pc-b"><span class="chip">${esc(c.category)}</span><h3 class="pc-t">${esc(c.title)}</h3><div class="cc-m">${esc(c.level)} · ${esc(c.duration)}</div><div class="pc-p">${taka(c.price)}</div>${c.oldPrice ? `<div class="pc-w"><s>${taka(c.oldPrice)}</s></div>` : ''}</div></a>`;
}
function bcard(b) {
  return `<a class="bcard" href="/blog/${b._s}/"><div class="bcard-i"><img src="${esc(b.image || '/assets/placeholder.svg')}" alt="${esc(b.title)}" width="480" height="270" loading="lazy"></div><div class="bcard-b"><span class="chip">${esc(b.category)}</span><h3>${esc(b.title)}</h3><p>${esc(b.excerpt)}</p><span class="bcard-d">${esc(dateBn(b.date))}</span></div></a>`;
}
const secHead = (t, link, label) => `<div class="sh"><h2>${esc(t)}</h2>${link ? `<a class="btn-o" href="${link}">${esc(label || 'সব দেখুন')}</a>` : ''}</div>`;

/* ---------- home ---------- */
function home() {
  const flash = PR.filter(p => p.flash);
  const showFlash = S.flash && S.flash.enabled && flash.length && new Date(S.flash.endsAt) > new Date();
  const bg = (b) => b.image ? `background-image:url(${esc(b.image)});background-size:cover` : `background:linear-gradient(120deg,${color(b.color1)},${color(b.color2)})`;
  const slides = (S.banners || []).map((b, i) => `<div class="sl${i === 0 ? ' on' : ''}" style="${bg(b)}"><div class="sl-t"><h2>${esc(b.title)}</h2><p>${esc(b.subtitle)}</p>${b.button ? `<a class="btn" href="${esc(safeUrl(b.link))}">${esc(b.button)}</a>` : ''}</div><span class="sl-d1"></span><span class="sl-d2"></span></div>`).join('');
  const body = `
<section class="w hero"><aside class="side" aria-label="ক্যাটাগরি"><ul>${S.categories.map(c => `<li><a href="/category/${c.slug}/">${ic(c.icon)}<span>${esc(c.name)}</span>${ic('chev', 'ch')}</a></li>`).join('')}</ul></aside>
<div class="cr" id="cr" aria-roledescription="carousel" aria-label="অফার ব্যানার"><div class="cr-s">${slides}</div><div class="cr-d">${(S.banners || []).map((_, i) => `<button type="button" aria-label="ব্যানার ${bn(i + 1)}" aria-current="${i === 0}"></button>`).join('')}</div></div>
<div class="tiles">${(S.tiles || []).map(t => `<a class="tile" href="${esc(safeUrl(t.link))}" style="${bg(t)}"><strong>${esc(t.title)}</strong><span>${esc(t.subtitle)}</span></a>`).join('')}</div></section>
<section class="w trust"><div>${ic('shield')}<span><b>বাছাই করা প্রোডাক্ট</b>দাম ও রিভিউ দেখে নির্বাচন</span></div><div>${ic('check')}<span><b>অফিসিয়াল প্ল্যাটফর্মে কেনা</b>পেমেন্ট হয় Daraz-এ</span></div><div>${ic('coin')}<span><b>দাম একই থাকে</b>আমাদের লিংকে বাড়তি খরচ নেই</span></div><div>${ic('book')}<span><b>কেনার গাইড</b>ভুল সিদ্ধান্ত এড়াতে লেখা</span></div></section>
<section class="w box"><div class="sh"><h2>ক্যাটাগরি</h2></div><div class="cats">${S.categories.map(c => `<a href="/category/${c.slug}/"><span class="cats-i">${ic(c.icon)}</span><span>${esc(c.name)}</span></a>`).join('')}</div></section>
${showFlash ? `<section class="w box" id="flash"><div class="sh fs"><h2 class="fs-t">${esc(S.flash.title || 'ফ্ল্যাশ সেল')}</h2><div class="cd" data-end="${esc(S.flash.endsAt)}" aria-label="শেষ হতে বাকি"><span>শেষ হতে বাকি</span><b data-u="d">০০</b><i>:</i><b data-u="h">০০</b><i>:</i><b data-u="m">০০</b><i>:</i><b data-u="s">০০</b></div><a class="btn-o" href="/deals/">সব দেখুন</a></div><div class="hs-row">${flash.map(p => pcard(p)).join('')}</div></section>` : ''}
<section class="w box">${secHead('জনপ্রিয় কোর্স', '/courses/', 'সব কোর্স')}<div class="pgrid">${CR.slice(0, 5).map(ccard).join('')}</div></section>
<section class="w box"><div class="sh"><h2>আপনার জন্য বাছাই</h2></div><div class="pgrid" data-more="12">${PR.map((p, i) => pcard(p, i >= 12)).join('')}</div>${PR.length > 12 ? '<div class="more"><button type="button" class="btn-o big" data-loadmore>আরও দেখুন</button></div>' : ''}</section>
<section class="w box">${secHead('রিভিউ ও গাইড', '/blog/', 'সব লেখা')}<div class="bgrid">${PO.slice(0, 3).map(bcard).join('')}</div></section>`;
  const jl = ld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', name: S.name, url: SITE + '/', email: S.email, sameAs: [S.facebook, S.youtube].filter(Boolean) },
    { '@type': 'WebSite', name: S.name, url: SITE + '/', inLanguage: 'bn-BD', potentialAction: { '@type': 'SearchAction', target: SITE + '/search/?q={search_term_string}', 'query-input': 'required name=search_term_string' } }] });
  put('index.html', page({ title: S.name, desc: S.tagline + '। বাছাই করা ডিল, কোর্স তুলনা ও কেনাকাটার গাইড এক জায়গায়।', path: '/', extra: jl }, body));
}

/* ---------- listing pages ---------- */
function listing({ title, h1, desc, path: pth, items, crumb, intro }) {
  const bc = [['হোম', '/'], ...crumb];
  const body = `${crumbs(bc)}<section class="w lst"><aside class="flt" aria-label="ফিল্টার"><h2>ফিল্টার</h2>
<div class="fg"><label for="pmin">দাম (৳)</label><div class="pr"><input id="pmin" type="number" min="0" inputmode="numeric" placeholder="সর্বনিম্ন"><span>–</span><input id="pmax" type="number" min="0" inputmode="numeric" placeholder="সর্বোচ্চ"></div></div>
<div class="fg"><label for="rmin">ন্যূনতম রেটিং</label><select id="rmin"><option value="0">সব</option><option value="4.5">৪.৫ ও তার বেশি</option><option value="4">৪ ও তার বেশি</option><option value="3">৩ ও তার বেশি</option></select></div>
<div class="fg"><label class="ck"><input type="checkbox" id="onlyoff"> শুধু ছাড়ের প্রোডাক্ট</label></div>
<button type="button" class="btn-o" id="freset">রিসেট</button></aside>
<div class="lst-m"><div class="lst-h"><div><h1>${esc(h1)}</h1><p class="cnt"><span id="cnt">${bn(items.length)}</span>টি প্রোডাক্ট</p></div>
<div class="srt"><label for="sort">সাজান</label><select id="sort"><option value="rel">প্রাসঙ্গিক</option><option value="pa">দাম: কম থেকে বেশি</option><option value="pd">দাম: বেশি থেকে কম</option><option value="off">সর্বোচ্চ ছাড়</option><option value="rt">সেরা রেটিং</option></select></div></div>
${intro ? `<p class="intro">${esc(intro)}</p>` : ''}
<div class="pgrid pg4" id="plist" data-filter>${items.map(p => pcard(p)).join('') || '<p class="none">এই ক্যাটাগরিতে এখনো প্রোডাক্ট নেই।</p>'}</div><p class="none" id="nores" hidden>এই ফিল্টারে কিছু পাওয়া যায়নি। ফিল্টার বদলে দেখুন।</p></div></section>`;
  const jl = crumbLd(bc) + ld({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: SITE + pth, description: desc, mainEntity: { '@type': 'ItemList', itemListElement: items.slice(0, 30).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/product/' + p._s + '/', name: p.title })) } });
  put(pth.slice(1) + 'index.html', page({ title, desc, path: pth, extra: jl }, body));
}

/* ---------- product page ---------- */
function productPage(p) {
  const c = CAT[p.category] || { name: 'অন্যান্য', slug: p.category };
  const im = imgs(p).length ? imgs(p) : ['/assets/placeholder.svg'];
  const o = off(p);
  const rel = PR.filter(x => x !== p && x.category === p.category).concat(PR.filter(x => x !== p && x.category !== p.category)).slice(0, 6);
  const bc = [['হোম', '/'], [c.name, '/category/' + p.category + '/'], [p.title, '/product/' + p._s + '/']];
  const d = md(p.description);
  const body = `${crumbs(bc)}<article class="w pd">
<div class="pd-top"><div class="gal"><div class="gal-m"><img id="gm" src="${esc(im[0])}" alt="${esc(p.title)}" width="600" height="600">${o ? `<span class="pc-o lg">-${bn(o)}%</span>` : ''}</div>
${im.length > 1 ? `<div class="gal-t">${im.map((s, i) => `<button type="button" data-src="${esc(s)}" aria-label="ছবি ${bn(i + 1)}"${i === 0 ? ' aria-current="true"' : ''}><img src="${esc(s)}" alt="" width="64" height="64" loading="lazy"></button>`).join('')}</div>` : ''}</div>
<div class="inf"><h1>${esc(p.title)}</h1>
<div class="inf-m">${p.rating ? `${stars(p.rating)} <span>${bn(p.rating)}</span>` : ''}${p.brand ? `<span class="sep">ব্র্যান্ড: <b>${esc(p.brand)}</b></span>` : ''}<span class="sep">ক্যাটাগরি: <a href="/category/${p.category}/">${esc(c.name)}</a></span></div>
<div class="inf-p"><span class="now">${taka(p.price)}</span>${p.oldPrice ? `<s>${taka(p.oldPrice)}</s><em>-${bn(o)}%</em>` : ''}</div>
${(p.highlights || []).length ? `<ul class="hl-l">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
<div class="buy"><a class="btn big" href="/go/p/${p._s}" target="_blank" rel="sponsored nofollow noopener">${esc(p.store || 'Daraz')}-এ কিনুন ${ic('ext')}</a><p class="buy-n">বাটনে ক্লিক করলে ${esc(p.store || 'Daraz')}-এর পেজ খুলবে। পেমেন্ট ও ডেলিভারি সেখানেই হবে। সর্বশেষ আপডেট: ${esc(dateBn(p.updated || TODAY))}</p></div>
<div class="note">দাম ও স্টক যেকোনো সময় বদলাতে পারে। চূড়ান্ত দাম প্ল্যাটফর্মের পেজে দেখে নিন। <a href="/disclosure/">অ্যাফিলিয়েট নীতি</a></div></div></div>
<div class="pd-body"><section><h2>প্রোডাক্টের বিবরণ</h2><div class="prose">${d.html}</div></section>
${(p.specs || []).length ? `<section><h2>স্পেসিফিকেশন</h2><table class="spec"><tbody>${p.specs.map(s => `<tr><th scope="row">${esc(s.k)}</th><td>${esc(s.v)}</td></tr>`).join('')}</tbody></table></section>` : ''}</div>
</article>
<section class="w box">${secHead('আরও দেখুন')}<div class="pgrid">${rel.map(x => pcard(x)).join('')}</div></section>
<div class="sbar"><div><b>${taka(p.price)}</b>${p.oldPrice ? `<s>${taka(p.oldPrice)}</s>` : ''}</div><a class="btn" href="/go/p/${p._s}" target="_blank" rel="sponsored nofollow noopener">${esc(p.store || 'Daraz')}-এ কিনুন</a></div>`;
  const prod = { '@context': 'https://schema.org', '@type': 'Product', name: p.title, description: trunc(p.description, 300), image: imgs(p).map(abs), category: c.name, offers: { '@type': 'Offer', priceCurrency: 'BDT', price: String(p.price), url: SITE + '/product/' + p._s + '/', availability: 'https://schema.org/InStock', seller: { '@type': 'Organization', name: p.store || 'Daraz' } } };
  if (p.brand) prod.brand = { '@type': 'Brand', name: p.brand };
  put(`product/${p._s}/index.html`, page({ title: p.title + ' | দাম ও বিবরণ', desc: `${p.title} এর দাম ${taka(p.price)}। বিবরণ, স্পেসিফিকেশন ও কেনার তথ্য দেখুন।`, path: '/product/' + p._s + '/', type: 'product', image: imgs(p)[0], extra: crumbLd(bc) + ld(prod) }, body));
}

/* ---------- courses ---------- */
function coursesIndex() {
  const topics = [...new Set(CR.map(c => c.category))];
  const body = `${crumbs([['হোম', '/'], ['কোর্স', '/courses/']])}<section class="w box"><div class="sh"><div><h1>অনলাইন কোর্স</h1><p class="cnt">লেভেল, সময় ও দাম পাশাপাশি দেখে নিজের জন্য সেরাটি বাছুন</p></div></div>
<div class="tabs" id="ctabs"><button type="button" class="on" data-t="">সব</button>${topics.map(t => `<button type="button" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
<div class="pgrid pg4" id="clist">${CR.map(c => `<div class="cw" data-topic="${esc(c.category)}">${ccard(c)}</div>`).join('')}</div></section>`;
  put('courses/index.html', page({ title: 'অনলাইন কোর্স', desc: 'ফ্রিল্যান্সিং, ওয়েব ডেভেলপমেন্ট, গ্রাফিক ডিজাইন ও ডিজিটাল মার্কেটিংয়ের জনপ্রিয় অনলাইন কোর্সের তুলনা।', path: '/courses/', extra: crumbLd([['হোম', '/'], ['কোর্স', '/courses/']]) }, body));
}
function coursePage(c) {
  const bc = [['হোম', '/'], ['কোর্স', '/courses/'], [c.title, '/course/' + c._s + '/']];
  const o = off(c); const d = md(c.description);
  const rel = CR.filter(x => x !== c).slice(0, 5);
  const body = `${crumbs(bc)}<article class="w pd"><div class="pd-top"><div class="gal"><div class="gal-m"><img id="gm" src="${esc(mainImg(c))}" alt="${esc(c.title)}" width="600" height="600">${o ? `<span class="pc-o lg">-${bn(o)}%</span>` : ''}</div></div>
<div class="inf"><span class="chip">${esc(c.category)}</span><h1>${esc(c.title)}</h1>
<div class="inf-m">${c.rating ? `${stars(c.rating)} <span>${bn(c.rating)}</span>` : ''}<span class="sep">প্রোভাইডার: <b>${esc(c.provider)}</b></span></div>
<div class="inf-p"><span class="now">${taka(c.price)}</span>${c.oldPrice ? `<s>${taka(c.oldPrice)}</s><em>-${bn(o)}%</em>` : ''}</div>
<div class="facts"><div><span>লেভেল</span><b>${esc(c.level)}</b></div><div><span>সময়কাল</span><b>${esc(c.duration)}</b></div><div><span>ভাষা</span><b>${esc(c.language || 'বাংলা')}</b></div></div>
<div class="buy"><a class="btn big" href="/go/c/${c._s}" target="_blank" rel="sponsored nofollow noopener">কোর্সের বিস্তারিত দেখুন ${ic('ext')}</a><p class="buy-n">ভর্তি ও পেমেন্ট কোর্স প্রোভাইডারের সাইটে হবে। সর্বশেষ আপডেট: ${esc(dateBn(c.updated || TODAY))}</p></div>
<div class="note">দাম ও কোর্সের তথ্য বদলাতে পারে। ভর্তির আগে সিলেবাস ও রিফান্ড নীতি দেখে নিন। <a href="/disclosure/">অ্যাফিলিয়েট নীতি</a></div></div></div>
<div class="pd-body"><section><h2>কোর্স সম্পর্কে</h2><div class="prose">${d.html}</div></section>
${(c.learn || []).length ? `<section><h2>যা শিখবেন</h2><ul class="learn">${c.learn.map(l => `<li>${esc(l)}</li>`).join('')}</ul></section>` : ''}</div></article>
<section class="w box">${secHead('আরও কোর্স', '/courses/')}<div class="pgrid">${rel.map(ccard).join('')}</div></section>
<div class="sbar"><div><b>${taka(c.price)}</b>${c.oldPrice ? `<s>${taka(c.oldPrice)}</s>` : ''}</div><a class="btn" href="/go/c/${c._s}" target="_blank" rel="sponsored nofollow noopener">বিস্তারিত দেখুন</a></div>`;
  const jl = crumbLd(bc) + ld({ '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: trunc(c.description, 300), provider: { '@type': 'Organization', name: c.provider }, offers: { '@type': 'Offer', category: 'Paid', priceCurrency: 'BDT', price: String(c.price), url: SITE + '/course/' + c._s + '/' } });
  put(`course/${c._s}/index.html`, page({ title: c.title + ' | কোর্স তথ্য ও দাম', desc: `${c.title}, ${c.level}, ${c.duration}। দাম ${taka(c.price)}। সিলেবাস ও বিস্তারিত দেখুন।`, path: '/course/' + c._s + '/', image: imgs(c)[0], extra: jl }, body));
}

/* ---------- blog ---------- */
function blogIndex() {
  const body = `${crumbs([['হোম', '/'], ['ব্লগ', '/blog/']])}<section class="w box"><div class="sh"><div><h1>রিভিউ ও কেনাকাটার গাইড</h1><p class="cnt">কেনার আগে পড়ুন, ভুল সিদ্ধান্তের ঝুঁকি কমান</p></div></div><div class="bgrid">${PO.map(bcard).join('')}</div></section>`;
  put('blog/index.html', page({ title: 'রিভিউ ও কেনাকাটার গাইড', desc: 'অনলাইনে কেনাকাটা, গ্যাজেট, হোম ও ক্যারিয়ার নিয়ে সহজ ভাষায় গাইড ও রিভিউ।', path: '/blog/', extra: crumbLd([['হোম', '/'], ['ব্লগ', '/blog/']]) }, body));
}
function postPage(b) {
  const bc = [['হোম', '/'], ['ব্লগ', '/blog/'], [b.title, '/blog/' + b._s + '/']];
  const m = md(b.body); const words = String(b.body || '').split(/\s+/).length; const mins = Math.max(1, Math.round(words / 160));
  const rel = (b.related || []).map(s => PBY[s]).filter(Boolean);
  const others = PO.filter(x => x !== b).slice(0, 3);
  const body = `${crumbs(bc)}<div class="w art"><article class="art-m"><span class="chip">${esc(b.category)}</span><h1>${esc(b.title)}</h1>
<p class="art-i">${esc(b.author || S.name)} · ${esc(dateBn(b.date))} · পড়তে ${bn(mins)} মিনিট</p>
${b.image ? `<img class="art-img" src="${esc(b.image)}" alt="${esc(b.title)}" width="800" height="450">` : ''}
<p class="art-lead">${esc(b.excerpt)}</p>
${m.toc.length > 2 ? `<nav class="toc" aria-label="সূচিপত্র"><b>এই লেখায় যা আছে</b><ol>${m.toc.map(t => `<li><a href="#${t.id}">${esc(t.t)}</a></li>`).join('')}</ol></nav>` : ''}
<div class="prose">${m.html}</div>
<p class="disc">অ্যাফিলিয়েট ডিসক্লোজার: এই লেখার প্রোডাক্ট লিংকে কেনাকাটা করলে আমরা কমিশন পেতে পারি, আপনার দাম বাড়ে না।</p></article>
<aside class="art-s">${rel.length ? `<div class="sbox"><h2>এই লেখায় উল্লিখিত প্রোডাক্ট</h2>${rel.map(p => `<a class="mini" href="/product/${p._s}/"><img src="${esc(mainImg(p))}" alt="" width="64" height="64" loading="lazy"><span><b>${esc(p.title)}</b><i>${taka(p.price)}</i></span></a>`).join('')}</div>` : ''}
<div class="sbox"><h2>আরও পড়ুন</h2>${others.map(o => `<a class="mini txt" href="/blog/${o._s}/"><span><b>${esc(o.title)}</b></span></a>`).join('')}</div></aside></div>`;
  const jl = crumbLd(bc) + ld({ '@context': 'https://schema.org', '@type': 'Article', headline: b.title, description: b.excerpt, datePublished: b.date, dateModified: b.updated || b.date, inLanguage: 'bn-BD', author: { '@type': 'Organization', name: b.author || S.name }, publisher: { '@type': 'Organization', name: S.name }, mainEntityOfPage: SITE + '/blog/' + b._s + '/', ...(b.image ? { image: abs(b.image) } : {}) });
  put(`blog/${b._s}/index.html`, page({ title: b.title, desc: b.excerpt, path: '/blog/' + b._s + '/', type: 'article', image: b.image, extra: jl }, body));
}

/* ---------- static pages / search / 404 ---------- */
function staticPage(p) {
  const m = md(p.body);
  const form = p._s === 'contact' ? `<form class="cf" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field"><input type="hidden" name="form-name" value="contact"><p class="sr"><label>পূরণ করবেন না <input name="bot-field"></label></p>
<label for="cn">আপনার নাম</label><input id="cn" name="name" required><label for="ce">ইমেইল</label><input id="ce" name="email" type="email" required><label for="cm">বার্তা</label><textarea id="cm" name="message" rows="5" required></textarea><button class="btn" type="submit">পাঠান</button><p class="nl-m" role="status"></p></form>` : '';
  const bc = [['হোম', '/'], [p.title, '/' + p._s + '/']];
  put(`${p._s}/index.html`, page({ title: p.title, desc: trunc(String(p.body).replace(/[#*\-\[\]()]/g, ''), 150), path: '/' + p._s + '/', extra: crumbLd(bc) }, `${crumbs(bc)}<div class="w narrow-p"><h1>${esc(p.title)}</h1><div class="prose">${m.html}</div>${form}</div>`));
}
function searchPage() {
  put('search/index.html', page({ title: 'সার্চ', desc: 'প্রোডাক্ট, কোর্স ও ব্লগ খুঁজুন।', path: '/search/', noindex: true }, `<section class="w box"><div class="sh"><div><h1 id="sh1">সার্চ ফলাফল</h1><p class="cnt" id="scnt"></p></div></div><div class="tabs" id="stabs"><button type="button" class="on" data-k="">সব</button><button type="button" data-k="p">প্রোডাক্ট</button><button type="button" data-k="c">কোর্স</button><button type="button" data-k="b">ব্লগ</button></div><div class="pgrid pg4" id="sres"></div><p class="none" id="snone" hidden>কিছু পাওয়া যায়নি। অন্য শব্দে খুঁজুন।</p></section>`));
  const idx = [
    ...PR.map(p => ({ k: 'p', t: p.title, u: '/product/' + p._s + '/', i: mainImg(p), p: p.price, o: p.oldPrice || 0, c: (CAT[p.category] || {}).name || '' })),
    ...CR.map(c => ({ k: 'c', t: c.title, u: '/course/' + c._s + '/', i: mainImg(c), p: c.price, o: c.oldPrice || 0, c: c.category })),
    ...PO.map(b => ({ k: 'b', t: b.title, u: '/blog/' + b._s + '/', i: b.image || '/assets/placeholder.svg', c: b.category }))];
  put('search-index.json', JSON.stringify(idx));
}
function notFound() {
  put('404.html', page({ title: 'পেজ পাওয়া যায়নি', desc: 'এই পেজটি পাওয়া যায়নি।', path: '/404.html', noindex: true }, `<div class="w nf"><h1>৪০৪</h1><p>এই পেজটি খুঁজে পাওয়া যায়নি।</p><a class="btn" href="/">হোমে ফিরুন</a></div>`));
}

/* ---------- run ---------- */
home();
listing({ title: 'সব ডিল ও অফার', h1: 'সব ডিল', desc: 'বাছাই করা সব প্রোডাক্ট ও অফার এক জায়গায়, দাম ও রেটিং দিয়ে সাজিয়ে দেখুন।', path: '/deals/', items: PR, crumb: [['সব ডিল', '/deals/']] });
S.categories.forEach(c => listing({ title: c.name + ' | সেরা ডিল ও দাম', h1: c.name, desc: `${c.name} ক্যাটাগরির বাছাই করা প্রোডাক্ট, দাম ও রেটিং। কেনার আগে তুলনা করে দেখুন।`, path: `/category/${c.slug}/`, items: PR.filter(p => p.category === c.slug), crumb: [[c.name, `/category/${c.slug}/`]] }));
PR.forEach(productPage);
coursesIndex(); CR.forEach(coursePage);
blogIndex(); PO.forEach(postPage);
PG.forEach(staticPage);
searchPage(); notFound();

put('assets/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#F85606"/><path d="M8 16V9h7l9 9-7 7-9-9z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="1.4" fill="#fff"/></svg>`);

const urls = ['/', '/deals/', '/courses/', '/blog/', ...S.categories.map(c => `/category/${c.slug}/`), ...PR.map(p => `/product/${p._s}/`), ...CR.map(c => `/course/${c._s}/`), ...PO.map(b => `/blog/${b._s}/`), ...PG.map(p => `/${p._s}/`)];
put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${esc(SITE + u)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
put('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /go/\nDisallow: /search/\n\nSitemap: ${SITE}/sitemap.xml\n`);
const red = [];
PR.forEach(p => { if (/^https?:\/\//.test(p.link || '')) red.push(`/go/p/${p._s}  ${p.link}  302`); });
CR.forEach(c => { if (/^https?:\/\//.test(c.link || '')) red.push(`/go/c/${c._s}  ${c.link}  302`); });
put('_redirects', red.join('\n') + '\n');
put('_headers', '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/go/*\n  X-Robots-Tag: noindex, nofollow\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');

fs.rmSync(OUT, { recursive: true, force: true });
for (const [p, c] of files) { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c); }
const copy = (src, dst) => { if (!fs.existsSync(src)) return; fs.mkdirSync(dst, { recursive: true }); for (const e of fs.readdirSync(src, { withFileTypes: true })) { const s = path.join(src, e.name), d = path.join(dst, e.name); e.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d); } };
copy(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
copy(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
copy(path.join(ROOT, 'uploads'), path.join(OUT, 'uploads'));
console.log('Built', files.size, 'files →', OUT);
