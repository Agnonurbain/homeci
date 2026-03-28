const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function createPdf(txtFile, pdfFile) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(pdfFile));
  const text = fs.readFileSync(txtFile, 'utf8');
  doc.font('Helvetica').fontSize(11).text(text, { align: 'justify' });
  doc.end();
  console.log('Created ' + pdfFile);
}

const dir = path.join(__dirname, 'public/cgv');
createPdf(path.join(dir, 'cgv-locataire.txt'), path.join(dir, 'cgv-locataire.pdf'));
createPdf(path.join(dir, 'cgv-proprietaire.txt'), path.join(dir, 'cgv-proprietaire.pdf'));
createPdf(path.join(dir, 'cgv-notaire.txt'), path.join(dir, 'cgv-notaire.pdf'));
