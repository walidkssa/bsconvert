import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function testPdfLib() {
  console.log('🧪 TEST DE PDF-LIB\n');
  console.log('=' .repeat(60));

  try {
    // Tester avec ton fichier exact
    const pdfPath = path.join(process.cwd(), 'statement_9395625_EUR_2024-01-01_2025-11-18.pdf');

    console.log('\n1️⃣ Lecture du fichier...');
    console.log(`   Chemin: ${pdfPath}`);

    if (!fs.existsSync(pdfPath)) {
      console.log('   ⚠️  Fichier non trouvé, créons un PDF de test...');

      // Créer un PDF de test simple
      const testPdf = await PDFDocument.create();
      testPdf.addPage();
      testPdf.addPage();
      testPdf.addPage();
      const pdfBytes = await testPdf.save();

      const testBuffer = Buffer.from(pdfBytes);
      console.log(`   ✅ PDF de test créé (${testBuffer.length} bytes)`);

      // Tester avec le PDF de test
      const testDoc = await PDFDocument.load(testBuffer);
      const testPageCount = testDoc.getPageCount();
      console.log(`   📄 Pages du PDF de test: ${testPageCount}`);

      if (testPageCount === 3) {
        console.log('   ✅ pdf-lib fonctionne correctement!');
      } else {
        console.log('   ❌ Erreur: attendu 3 pages, obtenu', testPageCount);
      }
    } else {
      const buffer = fs.readFileSync(pdfPath);
      console.log(`   ✅ Fichier lu (${buffer.length} bytes)`);

      console.log('\n2️⃣ Chargement du PDF avec pdf-lib...');
      const pdfDoc = await PDFDocument.load(buffer);

      console.log('\n3️⃣ Comptage des pages...');
      const pageCount = pdfDoc.getPageCount();
      console.log(`   📄 Nombre de pages: ${pageCount}`);

      console.log('\n4️⃣ Informations additionnelles...');
      console.log(`   Titre: ${pdfDoc.getTitle() || 'N/A'}`);
      console.log(`   Auteur: ${pdfDoc.getAuthor() || 'N/A'}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ pdf-lib est FONCTIONNEL!');

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    console.error('\nDétails:', error instanceof Error ? error.message : error);
  }
}

testPdfLib().catch(console.error);
