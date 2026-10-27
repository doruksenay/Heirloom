import type { Lang } from '../engine/types';
import { fmtMoneyShort } from '../engine/context';
import { getCountry } from '../engine/world';

const symbols = new Map<string, string>();
function symbolOf(countryId: string): string {
  let s = symbols.get(countryId);
  if (s === undefined) {
    const { code } = getCountry(countryId).currency;
    s = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find((x) => x.type === 'currency')?.value ?? '';
    symbols.set(countryId, s);
  }
  return s;
}

const trNum = (v: number, digits: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: digits }).format(v);

/**
 * Short money for tiles and pills. English keeps the engine's compact form (£957K, $1.5M);
 * Turkish reads the way people say it: "₺908 bin", "₺1,5 milyon", "₺2,3 milyar".
 */
export function fmtShort(n: number, countryId = 'us', lang: Lang = 'en'): string {
  if (lang !== 'tr') return fmtMoneyShort(n, countryId, lang);
  const v = n * getCountry(countryId).currency.rate;
  const a = Math.abs(v);
  if (a < 10_000) return fmtMoneyShort(n, countryId, lang);
  const sign = v < 0 ? '-' : '';
  const sym = symbolOf(countryId);
  if (Math.round(a / 1e3) < 1000) return `${sign}${sym}${trNum(Math.round(a / 1e3), 0)} bin`;
  if (a < 1e9) return `${sign}${sym}${trNum(a / 1e6, a < 1e7 ? 1 : 0)} milyon`;
  return `${sign}${sym}${trNum(a / 1e9, a < 1e10 ? 1 : 0)} milyar`;
}
