import fs from 'node:fs'; import path from 'node:path'; const ROOT=process.cwd(); const setResult=(...a)=>console.log(JSON.stringify(a));
function checkCredits() {
  const assetDir = path.join(ROOT, 'src/assets/agrinas');
  const files = fs.existsSync(assetDir) ? fs.readdirSync(assetDir).filter((f) => !f.startsWith('.') && /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f)).map((f) => `src/assets/agrinas/${f}`) : [];
  const credits = path.join(ROOT, 'CREDITS.md');
  if (!fs.existsSync(credits)) return setResult('credits', 'FAIL', `CREDITS.md tidak ditemukan; ${files.length} aset tidak tercatat`, { assets: files, missingInCredits: files });
  const txt = fs.readFileSync(credits, 'utf8');
  const rows = txt.split('\n').filter((l) => /^\|/.test(l)).map((l) => l.split('|').map((c) => c.trim())).filter((c) => /^src\//.test(c[2] || ''));
  const listed = [...new Set(rows.map((c) => c[2].replace(/`/g, '')))];
  const missingInCredits = files.filter((f) => !listed.includes(f));
  const orphanInCredits = listed.filter((f) => !fs.existsSync(path.join(ROOT, f)));
  const badRows = rows.filter((c) => !/^https?:\/\//.test(c[3] || '') || !c[4]).map((c) => c[2]);
  const legacy = fs.existsSync(path.join(ROOT, 'src/assets/photos')) || /unsplash/i.test(txt);
  const ok = !missingInCredits.length && !orphanInCredits.length && !badRows.length && !legacy && files.length > 0;
  setResult('credits', ok ? 'PASS' : 'FAIL', `${files.length} aset di src/assets/agrinas, ${listed.length} baris CREDITS; ${missingInCredits.length} aset tak tercatat, ${orphanInCredits.length} baris tanpa file, ${badRows.length} baris tanpa URL sumber/pemilik${legacy ? ', SISA Unsplash/src/assets/photos terdeteksi' : ''}`, { creditsFile: 'CREDITS.md', assets: files, missingInCredits, orphanInCredits, badRows, legacy });
}

checkCredits();
