#!/usr/bin/env node
/**
 * Copies the Chinese overlay modules into the repo.
 *
 * One module per author, so three people can write Chinese without touching a
 * shared file — and so the generated aggregation in starter-zh.ts never has to be
 * rewritten. (The first attempt at a similar merge silently deleted hand-made
 * entries; separate files per author make that impossible.)
 */
import { existsSync, readFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const GROUPS = [
  ['vietnam', 'vietnam'],
  ['cambodia-philippines', 'cambodia-philippines'],
  ['bali-hotels', 'bali-hotels'],
  ['vietnam-2', 'vietnam-cities'],
];
let moved = 0;

for (const [group, module] of GROUPS) {
  const source = `/tmp/zh-${group}.ts`;
  const target = join(ROOT, 'lib/data/zh/overlay', `${module}.ts`);
  if (!existsSync(source)) {
    console.log(`  --  ${group}: no author file yet`);
    continue;
  }
  const text = readFileSync(source, 'utf8');
  // bali-hotels only authors the HOTELS map; the other two author all three.
  const required = module === 'bali-hotels' ? ['HOTELS'] : ['AREAS', 'HOTELS', 'PLACES'];
  let ok = true;
  for (const name of required) {
    if (!new RegExp(`export const ${name}\\s*:`).test(text)) {
      console.error(`  !!  ${group}: missing \`export const ${name}\``);
      ok = false;
    }
  }
  if (!ok) {
    process.exitCode = 1;
    continue;
  }
  copyFileSync(source, target);
  const count = (name) => (text.match(new RegExp(`'[^']+':\\s*\\{`, 'g')) ?? []).length;
  moved += 1;
  console.log(`  ok  ${group}: ${count()} record(s)`);
}
console.log(`\n${moved} overlay module(s) moved.`);
