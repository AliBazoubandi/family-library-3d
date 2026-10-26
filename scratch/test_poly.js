export async function scanBundle(url) {
  const res = await fetch(url);
  const html = await res.text();
  const idx = html.indexOf('window.__SERVER_APP_STATE__');
  if (idx === -1) return [];
  const scriptEnd = html.indexOf('</script>', idx);
  const code = html.slice(idx + 'window.__SERVER_APP_STATE__ ='.length, scriptEnd).trim();
  const data = JSON.parse(code);
  const list = data.initialData.list;
  return (list.Models || []).map(m => ({
    title: m.title,
    bundle: list.Name,
    creator: m.creator?.username,
    previewUrl: m.previewUrl,
    glbUrl: m.previewUrl?.replace('.webp', '.glb'),
    licence: m.licence
  }));
}

async function listKenney() {
  const models = await scanBundle('https://poly.pizza/bundle/Furniture-Kit-NoG1sEUD1z');
  console.log('Kenney models:');
  models.forEach(m => {
    if (/book|chair|table|desk|shelf|plant|lamp|couch|lounge|rug/i.test(m.title)) {
      console.log(`- ${m.title}: ${m.glbUrl}`);
    }
  });
}
// listKenney();
