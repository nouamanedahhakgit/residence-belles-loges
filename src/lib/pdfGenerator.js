import { jsPDF } from 'jspdf';
import { nombreEnLettres } from './numberToWords';

/**
 * Génère et télécharge l'Appel de Fond officiel en PDF vectoriel haute définition
 */
export function generateAppelDeFondPDF({
  numeroRef = `AF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  dateEmission = new Date().toLocaleDateString('fr-FR'),
  coproprietaireNom = 'MME HIND DRIOUECH ET MR ABDELAH NACHIT',
  lots = [{ code: 'M02', nom: 'Magasin N° 2', montant: 1800, observation: 'DE OCTOBRE-2026 À DÉCEMBRE-2026' }],
  residenceNom = 'SYNDICAT RESIDENCE BELLES LOGES',
  residenceAdresse = 'RUE ATTABARI, QUARTIER LES PRINCESSES, CASABLANCA',
  rib = '011 780 0000402100011545 25',
  banque = 'BMCE Bank of Africa',
  arrieres = 0,
  observationGenerale = ''
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Palette de couleurs professionnelles
  const primaryColor = [15, 23, 42];     // slate-900
  const emeraldColor = [22, 163, 74];   // green-600
  const accentGold = [217, 119, 6];     // amber-600
  const lightBg = [248, 250, 252];      // slate-50
  const borderColor = [203, 213, 225];  // slate-300
  const textDark = [30, 41, 59];        // slate-800
  const textMuted = [100, 116, 139];    // slate-500

  // 1. Cadre décoratif extérieur
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // 2. En-tête / Header avec bande colorée
  doc.setFillColor(...primaryColor);
  doc.rect(10, 10, pageWidth - 20, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(residenceNom.toUpperCase(), pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(residenceAdresse, pageWidth / 2, 27, { align: 'center' });
  doc.text('Régie par la Loi 18-00 relative à la copropriété au Maroc', pageWidth / 2, 32, { align: 'center' });

  // 3. Titre du document & Date
  let currentY = 46;
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('APPEL DE FOND DES CHARGES COMMUNES DE COPROPRIÉTÉ', 15, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(`Réf : ${numeroRef}`, 15, currentY + 6);
  doc.text(`Casablanca, le ${dateEmission}`, pageWidth - 15, currentY + 6, { align: 'right' });

  // Ligne de séparation
  currentY += 12;
  doc.setDrawColor(...borderColor);
  doc.line(15, currentY, pageWidth - 15, currentY);

  // 4. Bloc Destinataire / Copropriétaire
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
  doc.setFontSize(11);
  doc.text(coproprietaireNom.toUpperCase(), 20, currentY + 14);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Merci de bien vouloir trouver ci-joint le détail de votre contribution aux charges de la copropriété :', 15, currentY + 28);

  // 5. Tableau des contributions (Identique au tableau de l'Excel)
  currentY += 34;

  const colX = {
    designation: 15,
    lot: 95,
    montant: 130,
    observation: 155,
    end: pageWidth - 15
  };

  // En-tête du tableau
  doc.setFillColor(...primaryColor);
  doc.rect(colX.designation, currentY, colX.end - colX.designation, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DÉSIGNATION', colX.designation + 3, currentY + 6);
  doc.text('N° DE LOT', colX.lot + 3, currentY + 6);
  doc.text('MONTANT (DH)', colX.montant + 3, currentY + 6);
  doc.text('PÉRIODE / OBSERVATION', colX.observation + 3, currentY + 6);

  currentY += 9;

  // Lignes des lots
  let totalMontant = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);

  lots.forEach((item, index) => {
    const rowHeight = 9;
    const isEven = index % 2 === 0;

    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(colX.designation, currentY, colX.end - colX.designation, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(colX.designation, currentY, colX.end - colX.designation, rowHeight, 'D');

    const m = Number(item.montant) || 0;
    totalMontant += m;

    const designation = item.designation || 'Prévisions des charges communes';
    doc.text(designation, colX.designation + 3, currentY + 6);
    doc.text(String(item.code || item.nom), colX.lot + 3, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${m.toLocaleString('fr-FR')} DH`, colX.montant + 3, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(String(item.observation || observationGenerale || 'Année 2026'), colX.observation + 3, currentY + 6);

    currentY += rowHeight;
  });

  // Si arriérés antérieurs
  if (arrieres > 0) {
    const rowHeight = 9;
    doc.setFillColor(254, 242, 242); // rouge clair
    doc.rect(colX.designation, currentY, colX.end - colX.designation, rowHeight, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.rect(colX.designation, currentY, colX.end - colX.designation, rowHeight, 'D');

    totalMontant += Number(arrieres);
    doc.setTextColor(185, 28, 28);
    doc.text('Rappel : Arriérés d’exercices antérieurs', colX.designation + 3, currentY + 6);
    doc.text('-', colX.lot + 3, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${Number(arrieres).toLocaleString('fr-FR')} DH`, colX.montant + 3, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('Impayés à régulariser', colX.observation + 3, currentY + 6);
    doc.setTextColor(...textDark);

    currentY += rowHeight;
  }

  // Ligne TOTAL À PAYER
  const totalRowHeight = 11;
  doc.setFillColor(...emeraldColor);
  doc.rect(colX.designation, currentY, colX.end - colX.designation, totalRowHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL À PAYER :', colX.designation + 4, currentY + 7.5);
  doc.setFontSize(12);
  doc.text(`${totalMontant.toLocaleString('fr-FR')} DIRHAMS`, colX.end - 5, currentY + 7.5, { align: 'right' });

  // 6. Arrêté en toutes lettres
  currentY += totalRowHeight + 8;
  const montantEnLettres = nombreEnLettres(totalMontant);

  doc.setFillColor(...lightBg);
  doc.roundedRect(15, currentY, pageWidth - 30, 14, 2, 2, 'F');
  doc.setDrawColor(...borderColor);
  doc.roundedRect(15, currentY, pageWidth - 30, 14, 2, 2, 'D');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Arrêté le présent appel de fond à la somme de :', 20, currentY + 6);
  doc.setTextColor(...accentGold);
  doc.setFontSize(9.5);
  doc.text(montantEnLettres, 20, currentY + 11);

  // 7. Modalités de règlement & RIB Bancaire (Crucial pour le Maroc)
  currentY += 20;

  doc.setFillColor(240, 253, 244); // brand green light
  doc.roundedRect(15, currentY, pageWidth - 30, 32, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, currentY, pageWidth - 30, 32, 2, 2, 'D');

  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MODALITÉS DE RÈGLEMENT (VIREMENT OU CHÈQUE) :', 20, currentY + 7);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Le règlement doit se faire sur le compte bancaire de la résidence ou par chèque à l’ordre de :', 20, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.text(`LIBELLÉ DU COMPTE : ${residenceNom.toUpperCase()}`, 20, currentY + 19);

  doc.setFont('courier', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`RIB : ${rib}`, 20, currentY + 26);

  // 8. Signature & Cachet du Syndic
  currentY += 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textDark);
  doc.text('Pour le Syndicat des Copropriétaires', pageWidth - 70, currentY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Le Bureau du Syndic (Signature & Cachet)', pageWidth - 70, currentY + 5);

  // Cadre pointillé pour cachet
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(pageWidth - 75, currentY + 8, 60, 24, 2, 2);
  doc.setLineDashPattern([], 0); // reset dash

  // 9. Pied de page légal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text('Document établi conformément à l\'article 24 de la loi 18-00 relative à la copropriété.', pageWidth / 2, pageHeight - 14, { align: 'center' });
  doc.text('Résidence Belles Loges • Casablanca • Généré automatiquement via le système de gestion syndicale', pageWidth / 2, pageHeight - 11, { align: 'center' });

  // Télécharger le PDF
  const filename = `Appel_de_Fond_${coproprietaireNom.replace(/[^a-zA-Z0-9]/g, '_')}_${numeroRef}.pdf`;
  doc.save(filename);

  return doc;
}

/**
 * Génère un Reçu officiel de paiement en PDF
 */
export function generateRecuPaiementPDF({
  numeroRecu = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  datePaiement = new Date().toLocaleDateString('fr-FR'),
  coproprietaireNom,
  lotNumero,
  lotCode,
  montant,
  modePaiement = 'Virement bancaire',
  reference = 'VIR-' + Math.floor(100000 + Math.random() * 900000),
  periode = 'Cotisation Année 2026',
  residenceNom = 'SYNDICAT RESIDENCE BELLES LOGES',
  residenceAdresse = 'RUE ATTABARI, QUARTIER LES PRINCESSES, CASABLANCA',
  rib = '011 780 0000402100011545 25'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 est parfait pour les reçus de paiement
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cadre
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // En-tête
  doc.setFillColor(15, 23, 42);
  doc.rect(8, 8, pageWidth - 16, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(residenceNom, pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(residenceAdresse, pageWidth / 2, 23, { align: 'center' });

  // Titre
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('REÇU DE COTISATION SYNDICALE', pageWidth / 2, 38, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° : ${numeroRecu}  •  Date : ${datePaiement}`, pageWidth / 2, 44, { align: 'center' });

  // Bloc Détails
  let y = 52;
  const items = [
    ['Copropriétaire', coproprietaireNom.toUpperCase()],
    ['Bien concerné', `${lotNumero} (${lotCode})`],
    ['Objet / Période', periode],
    ['Mode de paiement', `${modePaiement} (Réf: ${reference})`],
    ['Montant perçu', `${Number(montant).toLocaleString('fr-FR')} DIRHAMS`],
    ['Montant en lettres', nombreEnLettres(montant)]
  ];

  doc.setDrawColor(226, 232, 240);
  items.forEach(([label, value], idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.rect(14, y, pageWidth - 28, 8, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label + ' :', 18, y + 5.5);

    doc.setFont('helvetica', label.includes('Montant') ? 'bold' : 'normal');
    doc.setTextColor(label.includes('Montant perçu') ? 22 : 15, label.includes('Montant perçu') ? 163 : 23, label.includes('Montant perçu') ? 74 : 42);
    doc.text(String(value), 65, y + 5.5);

    y += 8;
  });

  // Signature
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Cachet & Visa du Syndic :', pageWidth - 55, y);

  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(pageWidth - 55, y + 3, 40, 20, 2, 2);
  doc.setLineDashPattern([], 0);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Ce reçu atteste de l\'encaissement effectif des sommes susmentionnées.', pageWidth / 2, pageHeight - 12, { align: 'center' });

  const filename = `Recu_${lotCode}_${numeroRecu}.pdf`;
  doc.save(filename);

  return doc;
}
