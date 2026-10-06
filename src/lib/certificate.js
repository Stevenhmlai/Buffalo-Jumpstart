const path = require('path');
const PDFDocument = require('pdfkit');
const { fmtDateLong } = require('./util');

const ROOT = path.join(__dirname, '..', '..');
const FONTS = {
  sig: path.join(ROOT, 'node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff'),
  display: path.join(ROOT, 'node_modules/@fontsource/archivo/files/archivo-latin-800-normal.woff'),
  bold: path.join(ROOT, 'node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff'),
  body: path.join(ROOT, 'node_modules/@fontsource/public-sans/files/public-sans-latin-400-normal.woff'),
  bodyBold: path.join(ROOT, 'node_modules/@fontsource/public-sans/files/public-sans-latin-600-normal.woff'),
};
const LOGO = path.join(ROOT, 'assets', 'logo-1200.png');

const SIGNATORIES = [
  { name: 'Terence Ng', title: 'Founder' },
  { name: 'Cannie Tan', title: 'Co-founder' },
];

const RED = '#A3121B';
const GOLD = '#C98A1B';
const INK = '#1C1C1C';
const GREY = '#4A4A4A';

function certificatePdf(stream, { name, code, date }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0, info: { Title: 'Buffalo Jumpstart Certificate', Author: 'Buffalo Investment Agency' } });
  doc.pipe(stream);
  for (const [k, f] of Object.entries(FONTS)) doc.registerFont(k, f);

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28

  doc.rect(0, 0, W, H).fill('#FFFDF8');
  // Borders
  doc.lineWidth(2).strokeColor(INK).rect(24, 24, W - 48, H - 48).stroke();
  doc.lineWidth(0.8).strokeColor(GOLD).rect(32, 32, W - 64, H - 64).stroke();
  // Red band at the top
  doc.rect(32.4, 32.4, W - 64.8, 6).fill(RED);

  // Logo
  const logoW = 92;
  doc.image(LOGO, (W - logoW) / 2, 58, { width: logoW });

  let y = 58 + logoW * (4392 / 4692) + 16;
  doc.font('bodyBold').fontSize(11).fillColor(RED).text('CERTIFICATE OF COMPLETION', 0, y, { width: W, align: 'center', characterSpacing: 4 });
  y += 22;
  doc.font('display').fontSize(38).fillColor(INK).text('Buffalo Jumpstart', 0, y, { width: W, align: 'center' });
  y += 56;
  doc.font('body').fontSize(13).fillColor(GREY).text('This is to certify that', 0, y, { width: W, align: 'center' });
  y += 22;

  // Name (shrink to fit long names)
  let size = 32;
  doc.font('bold');
  while (size > 18 && doc.fontSize(size).widthOfString(name) > W - 260) size -= 1;
  doc.fontSize(size).fillColor(INK).text(name, 0, y, { width: W, align: 'center' });
  y += size + 8;
  doc.moveTo(W / 2 - 200, y).lineTo(W / 2 + 200, y).lineWidth(0.8).strokeColor(GOLD).stroke();
  y += 8;
  doc.font('body').fontSize(11).fillColor(GREY).text(`Agent code ${code}`, 0, y, { width: W, align: 'center' });
  y += 24;
  doc.font('body').fontSize(12.5).fillColor('#333333').text(
    'has completed all training modules and passed every quiz in the Buffalo Jumpstart programme of Buffalo Investment Agency.',
    (W - 520) / 2, y, { width: 520, align: 'center', lineGap: 3 });

  // Footer: date + two signatures
  const baseY = H - 108;
  const colW = 200;
  const cols = [70, (W - colW) / 2, W - 70 - colW];

  // Date
  doc.font('bodyBold').fontSize(13).fillColor(INK).text(fmtDateLong(date), cols[0], baseY - 22, { width: colW, align: 'center' });
  doc.moveTo(cols[0], baseY).lineTo(cols[0] + colW, baseY).lineWidth(0.8).strokeColor(INK).stroke();
  doc.font('body').fontSize(10).fillColor(GREY).text('Date of completion', cols[0], baseY + 7, { width: colW, align: 'center' });

  SIGNATORIES.forEach((s, i) => {
    const x = cols[i + 1];
    doc.font('sig').fontSize(28).fillColor('#1F2A5A').text(s.name, x, baseY - 38, { width: colW, align: 'center' });
    doc.moveTo(x, baseY).lineTo(x + colW, baseY).lineWidth(0.8).strokeColor(INK).stroke();
    doc.font('bodyBold').fontSize(10.5).fillColor(INK).text(s.name, x, baseY + 7, { width: colW, align: 'center' });
    doc.font('body').fontSize(9.5).fillColor(GREY).text(`${s.title}, Buffalo Investment Agency`, x, baseY + 21, { width: colW, align: 'center' });
  });

  doc.end();
}

module.exports = { certificatePdf, SIGNATORIES };
