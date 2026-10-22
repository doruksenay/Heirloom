// Turns the single-file preview build into a page body that can be published as a shareable test link.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-preview/index.html', 'utf8');
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');

const page = `<meta charset="utf-8">
<title>Heirloom</title>
<meta name="claude:viewport-fit-sides" content="cover">
${styles}
<style>html,body{height:100%}body{margin:0;background:var(--bg-deep,#120E16)}</style>
<div id="app"></div>
${scripts}
`;
writeFileSync('dist-preview/heirloom.html', page);
console.log(`dist-preview/heirloom.html written (${Math.round(page.length / 1024)} KB)`);
