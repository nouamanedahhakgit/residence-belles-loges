const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// Charger les données initiales
const initialDataPath = path.join(__dirname, '..', 'src', 'data', 'initialData.js');
let rawData = fs.readFileSync(initialDataPath, 'utf8');
// Transformer l'export ES en JSON évaluable
const jsonStr = rawData.replace(/^export const initialData = /, '').replace(/;?\s*$/, '');
const initialData = JSON.parse(jsonStr);

// Nombre en lettres pour le Maroc
function nombreEnLettres(nombre) {
  const n = Math.floor(Number(nombre) || 0);
  if (n === 0) return 'ZÉRO DIRHAM';
  const unites = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
  const dizaines = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];

  function convertSmall(num) {
    if (num < 10) return unites[num];
    if (num < 20) {
      const spec = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
      return spec[num - 10];
    }
    const d = Math.floor(num / 10);
    const u = num % 10;
    return u === 0 ? dizaines[d] : `${dizaines[d]}-${unites[u]}`;
  }

  function convertHundreds(num) {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let res = '';
    if (h === 1) res = 'CENT';
    else if (h > 1) res = `${unites[h]} CENT${rest === 0 ? 'S' : ''}`;
    if (rest > 0) res = res ? `${res} ${convertSmall(rest)}` : convertSmall(rest);
    return res;
  }

  let result = '';
  const milliers = Math.floor(n / 1000);
  const reste = n % 1000;

  if (milliers === 1) result = 'MILLE';
  else if (milliers > 1) result = `${convertHundreds(milliers)} MILLE`;

  if (reste > 0) {
    result = result ? `${result} ${convertHundreds(reste)}` : convertHundreds(reste);
  }

  return `${result.trim()} DIRHAMS`.toUpperCase();
}

function generatePDFForLot(lot, copro, cotis) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [15, 23, 42];     // slate-900
  const emeraldColor = [22, 163, 74];   // green-600
  const accentGold = [217, 119, 6];     // amber-600
  const lightBg = [248, 250, 252];      // slate-50
  const borderColor = [203, 213, 225];  // slate-300
  const textDark = [30, 41, 59];        // slate-800
  const textMuted = [100, 116, 139];    // slate-500

  // 1. Cadre
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 2. Header
  doc.setFillColor(...primaryColor);
  doc.rect(10, 10, pageWidth - 20, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SYNDICAT RESIDENCE BELLES LOGES', pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('Rue Attabari, Quartier Les Princesses, Casablanca', pageWidth / 2, 27, { align: 'center' });
  doc.text('Loi 18-00 relative au statut de la copropriété au Maroc', pageWidth / 2, 32, { align: 'center' });

  // 3. Titre
  let currentY = 46;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('APPEL DE FOND DES CHARGES COMMUNES DE COPROPRIÉTÉ', 15, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(`Réf : AF-2026-${lot.code}`, 15, currentY + 6);
  doc.text(`Casablanca, le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 15, currentY + 6, { align: 'right' });

  currentY += 12;
  doc.setDrawColor(...borderColor);
  doc.line(15, currentY, pageWidth - 15, currentY);

  // 4. Copropriétaire
  currentY += 6;
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, currentY, pageWidth - 30, 22, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.roundedRect(15, currentY, pageWidth - 30, 22, 2, 2, 'D');

  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('COPROPRIÉTAIRE(S) :', 20, currentY + 7);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(copro.nom.toUpperCase(), 20, currentY + 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Détail de votre contribution aux charges de copropriété pour l\'exercice 2026 :', 15, currentY + 28);

  // 5. Tableau
  currentY += 34;
  const colX = { desig: 15, lot: 110, montant: 145, obs: 175 };

  // Header tableau
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, pageWidth - 30, 8, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(15, currentY, pageWidth - 30, 8, 'D');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DÉSIGNATION', colX.desig + 3, currentY + 5.5);
  doc.text('N° DE LOT', colX.lot, currentY + 5.5);
  doc.text('MONTANT', colX.montant + 15, currentY + 5.5, { align: 'right' });
  doc.text('OBSERVATION', colX.obs, currentY + 5.5);

  currentY += 8;

  // Montants
  const montantAnnuel = cotis ? cotis.montant_annuel || (lot.type === 'magasin' ? 1800 : 3600) : (lot.type === 'magasin' ? 1800 : 3600);
  const paye = cotis ? (cotis.months || []).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const resteAnnuel = Math.max(0, montantAnnuel - paye);
  const arrieres = cotis ? Number(cotis.arrieres) || 0 : 0;
  const montantCourant = resteAnnuel > 0 ? resteAnnuel : montantAnnuel;
  const totalGeneral = montantCourant + arrieres;

  // Ligne 1
  doc.setFillColor(255, 255, 255);
  doc.rect(15, currentY, pageWidth - 30, 10, 'F');
  doc.rect(15, currentY, pageWidth - 30, 10, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('Prévisions des charges communes de copropriété', colX.desig + 3, currentY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`${lot.nom} (${lot.code})`, colX.lot, currentY + 6.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(`${montantCourant.toLocaleString('fr-FR')} DH`, colX.montant + 15, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Année 2026', colX.obs, currentY + 6.5);

  currentY += 10;

  // Arriérés si existants
  if (arrieres > 0) {
    doc.setFillColor(254, 242, 242);
    doc.rect(15, currentY, pageWidth - 30, 9, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.rect(15, currentY, pageWidth - 30, 9, 'D');

    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Arriérés d’exercices antérieurs (2024 - 2025)', colX.desig + 3, currentY + 6);
    doc.text('-', colX.lot, currentY + 6);

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(`${arrieres.toLocaleString('fr-FR')} DH`, colX.montant + 15, currentY + 6, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.text('Impayés reportés', colX.obs, currentY + 6);

    currentY += 9;
  }

  // Total
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, pageWidth - 30, 10, 'F');
  doc.setDrawColor(...borderColor);
  doc.rect(15, currentY, pageWidth - 30, 10, 'D');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL À RÉGLER :', colX.desig + 3, currentY + 6.5);

  doc.setTextColor(...emeraldColor);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(`${totalGeneral.toLocaleString('fr-FR')} DH`, colX.montant + 15, currentY + 6.5, { align: 'right' });

  // 6. En lettres
  currentY += 15;
  doc.setFillColor(...lightBg);
  doc.roundedRect(15, currentY, pageWidth - 30, 15, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.roundedRect(15, currentY, pageWidth - 30, 15, 2, 2, 'D');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Arrêté le présent appel de fond à la somme de :', 20, currentY + 5.5);
  doc.setTextColor(...accentGold);
  doc.setFontSize(9);
  doc.text(nombreEnLettres(totalGeneral), 20, currentY + 11);

  // 7. Modalités & RIB BMCE
  currentY += 20;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, currentY, pageWidth - 30, 30, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, currentY, pageWidth - 30, 30, 2, 2, 'D');

  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('MODALITÉS DE RÈGLEMENT (VIREMENT BANCAIRE) :', 20, currentY + 6.5);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Virement ou versement à l\'ordre du compte syndical officiel :', 20, currentY + 12.5);

  doc.setFont('helvetica', 'bold');
  doc.text('BÉNÉFICIAIRE : SYNDICAT RESIDENCE BELLES LOGES', 20, currentY + 18);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`RIB BMCE : 011 780 0000402100011545 25`, 20, currentY + 25);

  // 8. Signature
  currentY += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  doc.text('Pour le Syndicat des Copropriétaires', pageWidth - 70, currentY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Le Bureau du Syndic (Cachet & Visa)', pageWidth - 70, currentY + 4.5);

  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(pageWidth - 75, currentY + 7, 60, 20, 2, 2);
  doc.setLineDashPattern([], 0);

  // 9. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Document officiel établi conformément à la loi 18-00 relative à la copropriété au Maroc.', pageWidth / 2, pageHeight - 13, { align: 'center' });
  doc.text('SYNDICAT RÉSIDENCE BELLES LOGES • Rue Attabari, Quartier Les Princesses, Casablanca', pageWidth / 2, pageHeight - 9, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

async function main() {
  console.log('--- GÉNÉRATION DES PDF STATIQUES POUR LES 33 LOTS ---');

  const publicPdfDir = path.join(__dirname, '..', 'public', 'pdf');
  if (!fs.existsSync(publicPdfDir)) {
    fs.mkdirSync(publicPdfDir, { recursive: true });
  }

  const coproMap = {};
  for (let c of initialData.coproprietaires) {
    coproMap[c.id] = c;
  }

  let count = 0;
  for (let lot of initialData.lots) {
    const copro = coproMap[lot.copro_id] || { nom: 'Copropriétaire Inconnu', tel: '' };
    const cotis = initialData.cotisations.find(c => c.lot_id === lot.id && c.annee === 2026);

    const pdfBuffer = generatePDFForLot(lot, copro, cotis);

    // Enregistrer sous appel-M01.pdf
    const filename1 = path.join(publicPdfDir, `appel-${lot.code}.pdf`);
    const filename2 = path.join(publicPdfDir, `appel-${lot.code.toLowerCase()}.pdf`);
    fs.writeFileSync(filename1, pdfBuffer);
    if (filename1 !== filename2) {
      fs.writeFileSync(filename2, pdfBuffer);
    }
    count++;
  }

  console.log(`✅ ${count} PDF officiels statiques générés avec succès dans public/pdf/ !`);
}

main().catch(err => {
  console.error('Erreur génération PDF:', err);
  process.exit(1);
});
