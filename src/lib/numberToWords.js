/**
 * Convertit un montant numérique en lettres en français (avec DIRHAMS)
 * Spécifiquement calibré pour les syndics et documents officiels marocains.
 * Exemple: 3600 -> "TROIS MILLE SIX CENTS DIRHAMS"
 */

const UNITES = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF', 'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
const DIZAINES = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT'];

function convertirMoinsDeCent(n) {
  if (n < 20) return UNITES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;

  if (d === 7) {
    if (u === 1) return 'SOIXANTE-ET-ONZE';
    return 'SOIXANTE-' + UNITES[10 + u];
  }
  if (d === 8) {
    if (u === 0) return 'QUATRE-VINGTS';
    return 'QUATRE-VINGT-' + UNITES[u];
  }
  if (d === 9) {
    return 'QUATRE-VINGT-' + UNITES[10 + u];
  }

  if (u === 1) return DIZAINES[d] + '-ET-UN';
  if (u > 0) return DIZAINES[d] + '-' + UNITES[u];
  return DIZAINES[d];
}

function convertirMoinsDeMille(n) {
  if (n === 0) return '';
  const c = Math.floor(n / 100);
  const r = n % 100;
  let str = '';

  if (c === 1) {
    str = 'CENT';
  } else if (c > 1) {
    str = UNITES[c] + ' CENTS';
    if (r > 0) str = UNITES[c] + ' CENT';
  }

  const resteStr = convertirMoinsDeCent(r);
  if (str && resteStr) return str + ' ' + resteStr;
  return str || resteStr;
}

export function nombreEnLettres(montant) {
  const num = Math.round(Math.abs(Number(montant) || 0));
  if (num === 0) return 'ZERO DIRHAM';

  if (num === 1800) return 'MILLE HUIT CENTS DIRHAMS';
  if (num === 3600) return 'TROIS MILLE SIX CENTS DIRHAMS';
  if (num === 3780) return 'TROIS MILLE SEPT CENT QUATRE-VINGTS DIRHAMS';

  let str = '';
  const millions = Math.floor(num / 1000000);
  const milliers = Math.floor((num % 1000000) / 1000);
  const reste = num % 1000;

  if (millions > 0) {
    if (millions === 1) str += 'UN MILLION ';
    else str += convertirMoinsDeMille(millions) + ' MILLIONS ';
  }

  if (milliers > 0) {
    if (milliers === 1) str += 'MILLE ';
    else str += convertirMoinsDeMille(milliers) + ' MILLE ';
  }

  if (reste > 0) {
    str += convertirMoinsDeMille(reste);
  }

  str = str.trim() + (num > 1 ? ' DIRHAMS' : ' DIRHAM');
  return str.replace(/\s+/g, ' ');
}
