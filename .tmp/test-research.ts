import { getPlaces, getAreas } from '../lib/data/index';
import { extractMentions, SAMPLE_GUIDE_TEXT } from '../lib/research/extract';
import { normalizePlaceName, nameSimilarity } from '../lib/research/normalize';
import { matchPlace } from '../lib/research/match';

console.log('--- 归一化：同一家店的不同写法应该收敛到同一个 key');
for (const v of ['La Brisa', 'La Brisa Bali', 'La Brisa Beach Club, Canggu', '  la brisa  ', '拉布里萨']) {
  console.log(`  ${JSON.stringify(v).padEnd(36)} -> ${normalizePlaceName(v)}`);
}
console.log('  不同店不应误合并:');
for (const [a, b] of [['La Brisa', 'La Favela'], ['Old Mans', "Old Man's"], ['Finns Beach Club', 'Finns']]) {
  console.log(`    ${a} vs ${b}: ${nameSimilarity(a, b).toFixed(3)}`);
}

const places = getPlaces('bali').map((p) => ({
  id: p.id, name: p.name, nameZh: p.nameZh, areaId: p.areaId,
  discovery: p.discovery, category: p.category,
}));
const areas = getAreas('bali').map((a) => ({ id: a.id, name: a.name, nameZh: a.nameZh }));

console.log('\n--- 提取示例攻略');
const result = extractMentions(SAMPLE_GUIDE_TEXT, places, areas);
console.log(`提到 ${result.mentions.length} 处，主导区域: ${result.dominantAreaHint}`);
for (const m of result.mentions) {
  const flag = m.matchedPlaceId ? '✓' : '?';
  console.log(`  ${flag} ${m.rawPlaceName.padEnd(26)} ${String(m.recommendationType).padEnd(11)} ${String(m.sentiment).padEnd(8)} ${m.matchedPlaceId ?? '(待确认)'} ${m.matchConfidence ?? ''}`);
  if (m.recommendedItems.length) console.log(`      菜品: ${m.recommendedItems.join('、')}`);
}

console.log('\n--- 匹配阈值检查：应当拒绝的近似名');
for (const name of ['La Brisa', 'Uluwatu Temple', 'Nusa Dua Beach', 'Fake Restaurant XYZ', 'Ubud']) {
  const r = matchPlace(name, places);
  console.log(`  ${name.padEnd(24)} -> ${r.placeId ?? '(无匹配)'} conf=${r.confidence.toFixed(2)} method=${r.method ?? '-'}`);
}
