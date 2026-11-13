# Tomball XR Lab: Page Workspace

Workspace for designing and testing the **Tomball XR Lab** page
(live: <https://www.lonestar.edu/Tomball-XR-Lab>) before changes go into the college CMS.
It works the same way as the [tomball3.0](https://github.com/Lone-Star-Research-Innovation/tomball3.0)
project: plain HTML, with no build step and nothing to install. Not an official Lone Star College page.

## Files

| File | What it is |
|------|------------|
| `index.html` | **The page.** The content between `BEGIN CMS CONTENT` and `END CMS CONTENT` is what goes into the CMS. It starts as an exact copy of the live content (November 13, 2026). The rest of the file is a preview wrapper. |
| `playground.html` | **Scratch page.** Sample XR Lab sections built from patterns already proven on lonestar.edu: hero, jump-link bar, key facts, cards, hours table, widget embed, call-to-action band. Try ideas here, then move what works into `index.html`. |
| `css/cms-fix.css` | Hosted on GitHub Pages and linked at the top of the content. Fixes the site-wide `body { width: 100vw }` bug that pushes content under the scrollbar. |
| `css/xr-lab.css` | Hosted on GitHub Pages and linked at the top of the content. The XR Lab theme in the logo's colors (navy, gold, white): `xr-dark` space bands, `xr-card`, `xr-eyebrow`, `xr-icon-circle`, `btn-xr` buttons, and more. Scoped to `.xr-page`, the wrapper around the CMS content, so it never touches the rest of the site. |
| `images/xr-lab-logo.png` | XR Lab logo, shown in the page's hero band. |
| `widgets/` | (Create when needed.) For anything interactive (search, filters, JavaScript): each widget is its own page on GitHub Pages, embedded with an iframe. |
| `preview/site-chrome.js` | **Preview only.** The real lonestar.edu header (navbar, search, Ask button) and footer, copied from the live page so previews show the full look. Generated; don't edit by hand. |
| `tools/check.js` | Lints the CMS block and compares it with the live page (see below). |
| `tools/update-chrome.js` | Regenerates `preview/site-chrome.js`. Run `node tools/update-chrome.js --live` if the college changes its header or footer. |
| `reference/` | Snapshot of the live page, refreshed by `node tools/check.js --live`. |

## Workflow

1. **Preview:** double-click `index.html` or `playground.html`, or use VS Code's *Live Server*
   extension so it reloads on save. Both pages load the **real lonestar.edu stylesheets**, so the
   layout matches the site, with the real college header and footer around it. The page is designed
   for the **full-width (no-sidebar) template**, so that's the preview default; the web team needs to
   switch the page to it at launch. Add `?sidebar` to the address to see it in the current template,
   or `?bare` to hide the header and footer. The yellow badge in the bottom corner has links for both.
2. **Experiment** in `playground.html`, then move the parts that work into `index.html`.
3. **Check:**
   ```
   node tools/check.js            # lint index.html
   node tools/check.js --live     # also compare with what's live right now
   ```
   Run `--live` before you start editing too. If someone changed the page in the CMS, it tells
   you, and the live content is saved to `reference/live-content.html` for comparison.
4. **Deploy hosted files** (CSS, widgets) by pushing to GitHub. Pages serves them at
   `https://lone-star-xr-lab.github.io/xr-website/…`.
5. **Paste into the CMS:** copy everything between the BEGIN/END markers into the page's
   HTML/source view. Paste into a **draft first** and check it before publishing.

**Hosted address:** files are assumed to live at `https://lone-star-xr-lab.github.io/xr-website/`
(a repository named `xr-website` in the `lone-star-xr-lab` organization). If you use a different
name, update it in the CMS content and in the `live` variable of the preview script in
`index.html` and `playground.html`. Until the files are deployed, the preview script loads them
from this folder instead.

## What the CMS allows

lonestar.edu runs OpenText Web Site Management (formerly RedDot). These are lessons from the XR Lab,
RIC, and Tomball 3.0 pages:

| Works | Doesn't work / be careful |
|-------|---------------------------|
| Bootstrap 5.3.3 classes (`row`, `col-md-6`, `card`, `btn`, `rounded`, `shadow-sm`, `bg-body-tertiary` …) | `<style>` blocks: tags stripped, CSS text shows on the page |
| LSC classes: `section-dark` (navy band), `icon-stacks` | `<script>`: won't run. Use a GitHub Pages widget in an iframe. |
| Font Awesome 5 icons (`<i class="fas fa-vr-cardboard">`) | `<div>`s were stripped on save once (Tomball 3.0 team section). Test-paste first. |
| `<p class="ratio ratio-16x9"><iframe>` for 360 views and video | Inline `background:` styles were dropped. Use an `<img>` instead. |
| `<iframe>` widgets from github.io, plus an "Open in a New Window" link | Empty `<a id>` at the start of a heading: the CMS adds a `<br />` |
| Simple inline `style="width:100%"` | `<link rel="stylesheet">` to a hosted file: **untested.** If it's stripped, the page falls back to plain Bootstrap styling. |
| | `<details>`/`<summary>` (FAQ and "Show the lab calendar"): **untested.** If stripped, the answers and calendar just show expanded. |
| | Pannellum URL options: `autoRotateStopDelay` is **not** accepted in the URL (the viewer shows an error), so the hero uses plain `autoRotate=-2` (rotates until someone clicks or drags it). |

**Other gotchas**

- **Characters:** the live page is served as `windows-1252`. Use entities (`&ndash;`, `&mdash;`,
  `&rsquo;`, `&nbsp;`) instead of typed curly quotes or dashes. The checker flags these.
- **Paragraph spacing:** the site adds 30px under every `<p>` and 10px above one that follows
  another. Add `mb-3 pt-0` (or your own `mb-*`) to each paragraph. The checker lists ones without spacing classes.
- **`section-dark`** turns all text white, including inside white cards. Add `text-dark` to card text.
- **Iframe heights** are fixed (the CMS won't run a resize script). Re-measure when widget content grows.
- Locally, Font Awesome icons and LSC fonts may show as boxes or fallback fonts. They're licensed
  for the lonestar.edu domain only.
