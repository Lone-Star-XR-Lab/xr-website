#!/usr/bin/env node
/*
 * XR Lab CMS checker. No install needed (Node 18+).
 *
 *   node tools/check.js              Lint the CMS block in index.html
 *   node tools/check.js playground.html
 *   node tools/check.js --live       Also download the live page and compare
 *
 * Lint catches what the CMS is known to break:
 *   - <style> blocks  (CMS strips the tags, CSS text shows on the page)
 *   - <script> tags   (won't run)
 *   - raw non-ASCII characters (the live page is windows-1252; use &ndash; etc.)
 *   - empty <a id> anchors inside headings (CMS adds a <br />)
 *   - <p> without mb-/pt- classes (site CSS adds big gaps)
 *   - iframes without a title (accessibility)
 *
 * --live saves the current page to reference/live-page.html and tells you if the
 * live content differs from index.html (someone edited it in the CMS, or your
 * changes haven't been pasted yet). The live content is saved to
 * reference/live-content.html so you can diff it in VS Code.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LIVE_URL = "https://www.lonestar.edu/Tomball-XR-Lab";
const args = process.argv.slice(2);
const live = args.includes("--live");
const file = args.find((a) => !a.startsWith("--")) || "index.html";

function cmsBlock(html) {
  const m = html.match(/BEGIN CMS CONTENT[^>]*-->([\s\S]*?)<!--[=\s]*END CMS CONTENT/);
  if (!m) throw new Error("No BEGIN/END CMS CONTENT markers found");
  return m[1];
}

function lint(block) {
  const problems = [];
  // Blank out comments (keeping line numbers) so notes like "no <style>" aren't flagged.
  const lines = block.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " ")).split("\n");
  const flag = (re, msg) =>
    lines.forEach((l, i) => { if (re.test(l)) problems.push(`line ${i + 1}: ${msg}`); });

  flag(/<style\b/i, "<style> block: the CMS strips the tags and the CSS shows as text. Use classes or a hosted .css <link>.");
  flag(/<script\b/i, "<script>: the CMS won't run it. Put interactive parts in a GitHub Pages widget (iframe).");
  lines.forEach((l, i) => {
    const bad = l.match(/[^\x00-\x7e]/g);
    if (bad) problems.push(`line ${i + 1}: non-ASCII ${JSON.stringify([...new Set(bad)].join(""))}. Use an entity (&ndash; &mdash; &rsquo; &nbsp; &bull;).`);
  });
  flag(/<h[1-6][^>]*>\s*<a [^>]*id="[^"]*"[^>]*>\s*<\/a>/i, "empty anchor at start of a heading: the CMS adds a <br />. Put the id on an eyebrow label instead.");
  flag(/<iframe(?![^>]*\btitle=)[^>]*>/i, "iframe without a title attribute.");
  flag(/<p(?![^>]*\b(mb-|pt-|my-|py-|m-0|p-0))(\s[^>]*)?>(?!\s*<(iframe|a id))/i, "<p> without spacing classes (add mb-3 pt-0) or the site CSS adds 30px+ gaps. (Advisory)");
  return problems;
}

const norm = (s) =>
  s.replace(/<!--[\s\S]*?-->/g, "").replace(/<link[^>]*cms-fix[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function main() {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const block = cmsBlock(html);
  const problems = lint(block);
  console.log(`\n${file}: CMS block is ${block.split("\n").length} lines, ${Buffer.byteLength(block)} bytes`);
  if (problems.length) {
    const hard = problems.filter((p) => !p.includes("(Advisory)"));
    const soft = problems.filter((p) => p.includes("(Advisory)"));
    hard.forEach((p) => console.log("  ✗ " + p));
    if (soft.length) console.log(`  · ${soft.length} advisory note(s): paragraphs without spacing classes (first: ${soft[0].split(":")[0]})`);
  } else {
    console.log("  ✓ no problems found");
  }

  if (!live) return;
  console.log(`\nDownloading ${LIVE_URL} ...`);
  const res = await fetch(LIVE_URL, { headers: { "User-Agent": "Mozilla/5.0 (xr-website checker)" } });
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.join(ROOT, "reference"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reference/live-page.html"), buf);
  const text = new TextDecoder("windows-1252").decode(buf).replace(/\r\n/g, "\n");
  const a = text.indexOf("<!-- begin content -->");
  const b = text.indexOf("<!-- end content -->");
  if (a < 0 || b < 0) return console.log("  Could not find the content markers on the live page; the template may have changed.");
  const liveBlock = text.slice(a + 22, b).trim().replace(/[^\x00-\x7e]/g, (c) => `&#${c.codePointAt(0)};`);
  fs.writeFileSync(path.join(ROOT, "reference/live-content.html"), liveBlock + "\n");

  // Compare after decoding entities so &ndash; and a raw dash count as equal.
  const decode = (s) => s.replace(/&ndash;/g, "&#8211;").replace(/&mdash;/g, "&#8212;").replace(/&bull;/g, "&#8226;")
    .replace(/&rsquo;/g, "&#8217;").replace(/&lsquo;/g, "&#8216;").replace(/&ldquo;/g, "&#8220;").replace(/&rdquo;/g, "&#8221;").replace(/&nbsp;/g, "&#160;");
  const same = decode(norm(liveBlock)) === decode(norm(block));
  console.log(same
    ? "  ✓ live page content matches " + file
    : `  ≠ live page content differs from ${file}. Compare reference/live-content.html with the CMS block in ${file}.`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
