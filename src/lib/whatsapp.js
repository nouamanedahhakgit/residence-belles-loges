/**
 * Module d'intégration WhatsApp pour la Résidence Belles Loges
 * Gère le formatage des numéros marocains et internationaux, ainsi que
 * la génération de templates personnalisés (Français & Darija).
 */

import { nombreEnLettres } from './numberToWords';

/**
 * Nettoie et formate un numéro pour WhatsApp API
 * @param {string} rawPhone - ex: "0669791313", "0661214852 / 0664908843", "00447551433285"
 * @returns {string[]} Liste des numéros au format international (sans le signe +)
 */
export function formatWhatsAppPhones(rawPhone) {
  if (!rawPhone) return [];

  // Séparer les numéros multiples par "/" ou ";" ou ","
  const parts = String(rawPhone).split(/[\/;,]/);
  const results = [];

  for (let part of parts) {
    let clean = part.replace(/[^\d+]/g, '').trim();
    if (!clean) continue;

    // Remplacer 00 par rien au début
    if (clean.startsWith('00')) {
      clean = clean.substring(2);
    } else if (clean.startsWith('+')) {
      clean = clean.substring(1);
    } else if (clean.startsWith('0') && clean.length === 10) {
      // Format standard Marocain 06... ou 07... ou 05...
      clean = '212' + clean.substring(1);
    }

    if (clean.length >= 9) {
      results.push(clean);
    }
  }

  return results;
}

/**
 * Modèles de messages prédéfinis
 */
export const MESSAGE_TEMPLATES = {
  APPEL_FOND_FR: 'APPEL_FOND_FR',
  APPEL_FOND_DARIJA: 'APPEL_FOND_DARIJA',
  RAPPEL_COURTOIS_FR: 'RAPPEL_COURTOIS_FR',
  RAPPEL_COURTOIS_DARIJA: 'RAPPEL_COURTOIS_DARIJA',
  RELANCE_URGENTE_FR: 'RELANCE_URGENTE_FR',
  RECU_PAIEMENT_FR: 'RECU_PAIEMENT_FR',
  RECU_PAIEMENT_DARIJA: 'RECU_PAIEMENT_DARIJA',
  ACCES_CLIENT_FR: 'ACCES_CLIENT_FR',
  ACCES_CLIENT_DARIJA: 'ACCES_CLIENT_DARIJA'
};

/**
 * Génère le texte complet du message WhatsApp
 */
export function generateWhatsAppMessage({
  template = MESSAGE_TEMPLATES.APPEL_FOND_FR,
  coproprietaireNom,
  lotCode,
  lotNumero,
  montantDu,
  periode = 'Année 2026',
  rib = '011 780 0000402100011545 25',
  banque = 'BMCE Bank of Africa',
  titulaire = 'SYNDICAT RESIDENCE BELLES LOGES',
  pdfLink = '',
  arrieres = 0,
  montantPaye = 0,
  clientPin = ''
}) {
  const montantLettres = nombreEnLettres(montantDu);
  const cleanLot = (lotCode || '').split(/[\s+,/]/)[0].trim();
  const defaultPdfUrl = `https://srbl.netlify.app/pdf/appel-${cleanLot}.pdf`;
  const finalPdfLink = pdfLink || defaultPdfUrl;
  const isDarijaTemplate = template.includes('DARIJA');
  const urlPdfSection = isDarijaTemplate 
    ? `\n📄 *رابط استدعاء الأداء الرسمي (PDF) :*\n👉 ${finalPdfLink}\n`
    : `\n📄 *Consulter votre Appel de Fond officiel (PDF) :*\n👉 ${finalPdfLink}\n`;

  switch (template) {
    case MESSAGE_TEMPLATES.APPEL_FOND_FR:
      return `🏢 *SYNDICAT RÉSIDENCE BELLES LOGES*
📍 _Rue Attabari, Quartier Les Princesses, Casablanca_

Bonjour *${coproprietaireNom}*,

Veuillez trouver ci-dessous l'appel de cotisations syndicales pour votre bien (*${lotNumero}* / ${lotCode}) :

📅 *Période :* ${periode}
💰 *Total à régler :* *${montantDu} DH*
📝 *Montant en lettres :* ${montantLettres}
${arrieres > 0 ? `⚠️ *Dont arriérés antérieurs :* ${arrieres} DH\n` : ''}${urlPdfSection}
🏦 *Coordonnées bancaires pour le virement :*
• *Bénéficiaire :* ${titulaire}
• *Banque :* ${banque}
• *RIB :* \`${rib}\`

_Pour faciliter l'identification de votre règlement, merci de mentionner en référence : "${lotCode} - ${coproprietaireNom}"._

Merci pour votre précieuse collaboration.
*Le Bureau du Syndic - Résidence Belles Loges*`;

    case MESSAGE_TEMPLATES.APPEL_FOND_DARIJA:
      return `🏢 *سنديك إقامة بيل لوج - RÉSIDENCE BELLES LOGES*
📍 _زنقة الطبري، حي الأميرات، الدار البيضاء_

السلام عليكم ورحمة الله،
السيد(ة) *${coproprietaireNom}* المحترم(ة)،

كنعلموكم بخصوص مساهمة السنديك الخاصة بـ (*${lotNumero}*) :

📅 *الفترة :* ${periode}
💰 *المبلغ المطلوب أداؤه :* *${montantDu} درهم*
${arrieres > 0 ? `⚠️ *منها متأخرات سابقة :* ${arrieres} درهم\n` : ''}${urlPdfSection}
🏦 *معلومات الحساب البنكي (RIB) :*
• *الحساب :* ${titulaire}
• *البنك :* ${banque}
• *الـ RIB :* \`${rib}\`

_المرجو كتابة رقم الشقة أو المحل (${lotCode}) في بيان التحويل (Motif de virement)._

شكراً جزيلاً على تفهمكم وحسن تعاونكم الدائم.
*إدارة سنديك إقامة بيل لوج*`;

    case MESSAGE_TEMPLATES.RAPPEL_COURTOIS_FR:
      return `🏢 *RAPPEL DE COTISATION - RÉSIDENCE BELLES LOGES*

Bonjour *${coproprietaireNom}*,

Nous espérons que vous allez bien.

Sauf erreur ou virement récent en cours de traitement de votre part, nous constatons un solde restant de *${montantDu} DH* concernant votre lot (*${lotNumero}*).

${arrieres > 0 ? `Pour rappel, ce montant inclut *${arrieres} DH* d'arriérés.\n` : ''}
🏦 *Règlement par virement sur le compte de la résidence :*
• *RIB :* \`${rib}\`
• *Bénéficiaire :* ${titulaire}
${urlPdfSection}
Si vous avez déjà procédé au règlement, nous vous prions d'ignorer ce message ou de nous transmettre l'avis d'opération.

Bien cordialement,
*Le Syndic - Résidence Belles Loges*`;

    case MESSAGE_TEMPLATES.RAPPEL_COURTOIS_DARIJA:
      return `🏢 *تذكير ودي - سنديك إقامة بيل لوج*

السلام عليكم ورحمة الله،
السيد(ة) *${coproprietaireNom}*،

كنتمناو تكونو في أحسن الأحوال.

تذكير بسيط بخصوص مساهمات السنديك المتبقية الخاصة بـ *${lotNumero}*، والمحددة في مبلغ: *${montantDu} درهم*.
${arrieres > 0 ? `(مع احتساب متأخرات بقيمة ${arrieres} درهم).\n` : ''}
🏦 *الحساب البنكي للسنديك :*
• *RIB :* \`${rib}\`
${urlPdfSection}
إلى كنتو ديجا درتو التحويل البنكي، المرجو تجاهل هذا الإشعار وموافاتنا بنسخة التوصيل لتأكيد التسجيل.

مع خالص التحيات والتقدير،
*سنديك إقامة بيل لوج*`;

    case MESSAGE_TEMPLATES.RELANCE_URGENTE_FR:
      return `⚠️ *URGENT - MISE À JOUR DES ARRIÉRÉS DE SYNDIC*
🏢 *RÉSIDENCE BELLES LOGES - CASABLANCA*

À l'attention de *${coproprietaireNom}* (*${lotNumero}*),

Nous attirons votre attention sur le retard important concernant le règlement des charges de copropriété.

🔴 *Total des impayés et arriérés :* *${montantDu} DH*
📝 *En toutes lettres :* ${montantLettres}

Conformément aux dispositions de la loi 18-00 relative à la copropriété, le bon fonctionnement des parties communes (gardiennage, électricité, ascenseur, entretien) dépend directement de la régularité de vos paiements.
${urlPdfSection}
Nous vous prions de régulariser cette situation sous huitaine sur le compte bancaire du syndicat :
🏦 *RIB :* \`${rib}\`
*Bénéficiaire :* ${titulaire}

Comptant sur votre diligence,
*Le Conseil Syndical*`;

    case MESSAGE_TEMPLATES.RECU_PAIEMENT_FR:
      return `✅ *CONFIRMATION DE RÈGLEMENT - RÉSIDENCE BELLES LOGES*

Bonjour *${coproprietaireNom}*,

Le Syndicat de la Résidence Belles Loges accuse bonne réception de votre paiement de *${montantPaye || montantDu} DH* au titre des charges syndicales pour le lot *${lotNumero}*.

📅 *Date d'enregistrement :* ${new Date().toLocaleDateString('fr-FR')}
${montantDu > 0 ? `ℹ️ *Solde restant à ce jour :* ${montantDu} DH\n` : '🎉 *Votre compte est désormais parfaitement À JOUR. Merci !*\n'}${urlPdfSection}
Merci pour votre civisme et votre contribution au bon fonctionnement de notre résidence.

*Le Syndic - Résidence Belles Loges*`;

    case MESSAGE_TEMPLATES.RECU_PAIEMENT_DARIJA:
      return `✅ *تأكيد استلام الأداء - سنديك إقامة بيل لوج*

السلام عليكم السيد(ة) *${coproprietaireNom}*،

كنأكدو ليكم التوصل بمبلغ *${montantPaye || montantDu} درهم* الخاص بمساهمة السنديك لـ *${lotNumero}*.

📅 *التاريخ :* ${new Date().toLocaleDateString('fr-FR')}
${montantDu > 0 ? `ℹ️ *الباقي حالياً :* ${montantDu} درهم\n` : '🎉 *حسابكم مخلص بالكامل (À jour). شكراً جزيلاً لكم !*\n'}${urlPdfSection}
شكراً لمساهمتكم في الحفاظ على الإقامة ومرافقها المشتركة.

*سنديك إقامة بيل لوج*`;

    case MESSAGE_TEMPLATES.ACCES_CLIENT_FR:
      return `🔐 *VOTRE ESPACE COPROPRIÉTAIRE PRIVÉ*
🏢 *SYNDICAT RÉSIDENCE BELLES LOGES*
📍 _Rue Attabari, Quartier Les Princesses, Casablanca_

Bonjour *${coproprietaireNom}*,

Nous avons le plaisir de vous transmettre vos accès personnels pour consulter votre compte syndic en ligne à tout moment :

👉 *Lien d'accès direct à votre espace :*
https://srbl.netlify.app/?client=${encodeURIComponent((lotCode || '').split(' ')[0] || 'lot')}

🔑 *Votre Code PIN sécurisé :* \`${clientPin || '1234'}\`
🏢 *Votre Bien :* ${lotNumero} (${lotCode})

📄 *Votre Appel de Fond officiel (PDF direct) :*
👉 ${finalPdfLink}

Sur votre espace privé, vous pouvez :
• Consulter l'état de vos cotisations et paiements en direct
• Télécharger vos Appels de Fonds officiels et Reçus en PDF
• Consulter le RIB officiel de la résidence pour vos virements

Bien cordialement,
*Le Bureau du Syndic - Résidence Belles Loges*`;

    case MESSAGE_TEMPLATES.ACCES_CLIENT_DARIJA:
      return `🔐 *حسابكم الخاص كملاك مشتركين - سنديك إقامة بيل لوج*
🏢 *RÉSIDENCE BELLES LOGES - CASABLANCA*

السلام عليكم ورحمة الله،
السيد(ة) *${coproprietaireNom}* المحترم(ة)،

تم تفعيل حسابكم الخاص لمتابعة مساهمات السنديك عبر الإنترنت في أي وقت :

👉 *رابط الدخول المباشر لحسابكم :*
https://srbl.netlify.app/?client=${encodeURIComponent((lotCode || '').split(' ')[0] || 'lot')}

🔑 *رمز الدخول السري (Code PIN) :* \`${clientPin || '1234'}\`
🏢 *رقم الشقة / المحل :* ${lotNumero}

📄 *تحميل استدعاء الأداء الرسمي مباشرة (PDF) :*
👉 ${finalPdfLink}

عبر حسابكم يمكنكم :
• معرفة الواجبات المؤداة والمتبقية مباشرة
• تحميل استدعاءات الأداء والوصولات بصيغة PDF
• الحصول على الحساب البنكي (RIB) لإجراء التحويلات

مع خالص التحيات والتقدير،
*إدارة سنديك إقامة بيل لوج*`;

    default:
      return `Bonjour ${coproprietaireNom}, votre solde syndic pour ${lotNumero} est de ${montantDu} DH. RIB: ${rib}`;
  }
}

/**
 * Génère le lien direct WhatsApp (wa.me)
 */
export function buildWhatsAppLink(phone, messageText) {
  const clean = String(phone).replace(/[^\d]/g, '');
  const encoded = encodeURIComponent(messageText);
  return `https://wa.me/${clean}?text=${encoded}`;
}

/**
 * Génère le lien direct WhatsApp Web
 */
export function buildWhatsAppWebLink(phone, messageText) {
  const clean = String(phone).replace(/[^\d]/g, '');
  const encoded = encodeURIComponent(messageText);
  return `https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`;
}
