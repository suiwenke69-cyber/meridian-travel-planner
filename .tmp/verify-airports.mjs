// Verify the airport coordinates in lib/data/origins.ts against OpenStreetMap.
const UA = 'MeridianTravelPlanner/1.0 (educational demo)';
const AIRPORTS = [
  ['SIN', 'Singapore Changi Airport'],
  ['XSP', 'Seletar Airport'],
  ['CAN', 'Guangzhou Baiyun International Airport'],
  ['SZX', 'Shenzhen Baoan International Airport'],
  ['HKG', 'Hong Kong International Airport'],
  ['PVG', 'Shanghai Pudong International Airport'],
  ['SHA', 'Shanghai Hongqiao International Airport'],
  ['HGH', 'Hangzhou Xiaoshan International Airport'],
  ['PEK', 'Beijing Capital International Airport'],
  ['PKX', 'Beijing Daxing International Airport'],
  ['CTU', 'Chengdu Shuangliu International Airport'],
  ['TFU', 'Chengdu Tianfu International Airport'],
  ['BKK', 'Suvarnabhumi Airport'],
  ['DMK', 'Don Mueang International Airport'],
  ['KUL', 'Kuala Lumpur International Airport'],
  ['CGK', 'Soekarno-Hatta International Airport'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const AGREE_KM = 5;
function km(a, b) {
  const R = 6371, t = (d) => (d * Math.PI) / 180;
  const dLat = t(b[0] - a[0]), dLng = t(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const out = [];
for (const [code, name] of AIRPORTS) {
  let results = null;
  for (let attempt = 0; attempt < 3 && !results; attempt += 1) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=jsonv2&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': UA, Accept: 'application/json' } },
      );
      if (res.ok) results = await res.json();
      else await sleep(4000 * (attempt + 1));
    } catch { await sleep(3000 * (attempt + 1)); }
  }
  const hit = Array.isArray(results) && results[0];
  out.push({ code, name, lat: hit ? Number(hit.lat) : null, lng: hit ? Number(hit.lon) : null, display: hit?.display_name ?? null });
  console.log(`${code}: ${hit ? `${Number(hit.lat).toFixed(4)}, ${Number(hit.lon).toFixed(4)}  ${hit.display_name.slice(0, 55)}` : 'NO RESULT'}`);
  await sleep(1300);
}
console.log('\nJSON:');
console.log(JSON.stringify(out, null, 1));
