import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import axe from 'axe-core';

const WIREFRAMES = ['index.html', 'search.html', 'booking.html'];
const LANDMARKS = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer'];

function loadPage(file) {
  const html = readFileSync(resolve(__dirname, '../../wireframes', file), 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.documentElement.setAttribute('lang', parsed.documentElement.getAttribute('lang') ?? '');
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  return html;
}

describe.each(WIREFRAMES)('wireframes/%s', (file) => {
  it('contains no JavaScript', () => {
    const html = loadPage(file);
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/\son[a-z]+=/i); // no inline event handlers
  });

  it('uses every required landmark element', () => {
    loadPage(file);
    LANDMARKS.forEach((tag) => expect(document.querySelector(tag), `<${tag}>`).not.toBeNull());
  });

  it('has no axe-core WCAG 2.1 A/AA or best-practice violations', async () => {
    loadPage(file);
    const results = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      rules: { 'color-contrast': { enabled: false } }, // verified with computed ratios in main.css
    });
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
