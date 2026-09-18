async function checkImages() {
  const routes = ['/', '/about', '/services', '/contact', '/services/deep-cleaning'];
  for (const r of routes) {
    const res = await fetch('http://localhost:4000' + r);
    const html = await res.text();
    const regex = /<img[^>]+(?:src|ngsrc)=["']([^"']+)["']/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const src = m[1];
      const clean = src.startsWith('http') ? src : (src.startsWith('/') ? 'http://localhost:4000' + src : 'http://localhost:4000/' + src);
      try {
        const imgRes = await fetch(clean);
        if (imgRes.status >= 400) {
          console.log(`❌ BROKEN on ${r}: ${clean} -> HTTP ${imgRes.status}`);
        } else {
          console.log(`✓ OK on ${r}: ${clean}`);
        }
      } catch (err) {
        console.log(`❌ FETCH ERROR on ${r}: ${clean} -> ${err.message}`);
      }
    }
  }
}
checkImages();
