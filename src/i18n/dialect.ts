/**
 * English dialects. The content is written in one mixed English ("favourite" next to "apologized", "mom" next to
 * "flat"). Every English line passes through localizeEn on its way out of Ctx.t, so a life in the US reads as American,
 * a life in Canada as Canadian and a life in the UK as British. Pure text: no state, no RNG, so a seed plays the
 * same life in every dialect.
 *
 * Rules are by whole word (a map lookup per word, cheap enough for the 1000-life simulation tests) plus a short list
 * of phrase rules for words that are only British in one sense ("a flat", "primary school", "on holiday").
 * Anything not listed is left alone: add to the lists below when a playtest finds another.
 */

export type Dialect = 'us' | 'ca' | 'uk';

/** UK → British, Canada → Canadian, every other country (Germany, Japan, Türkiye…) → American, the largest audience. */
export function dialectOf(countryId: string): Dialect {
  return countryId === 'uk' ? 'uk' : countryId === 'ca' ? 'ca' : 'us';
}

// ---------------------------------------------------------------- word tables

type Table = Map<string, string>;

/** Adds stem+suffix → stem'+suffix for every suffix. */
function family(map: Table, from: string, to: string, suffixes: string[]): void {
  for (const suf of suffixes) map.set(from + suf, to + suf);
}

const OUR = ['colour', 'favour', 'neighbour', 'honour', 'rumour', 'behaviour', 'flavour', 'labour', 'humour', 'harbour', 'savour', 'vapour', 'armour', 'tumour', 'odour', 'endeavour', 'parlour', 'splendour', 'valour', 'vigour', 'candour', 'clamour', 'demeanour', 'fervour', 'rigour', 'ardour', 'saviour'];
const OUR_SUF = ['', 's', 'ed', 'ing', 'ite', 'ites', 'ful', 'less', 'able', 'ably', 'hood', 'hoods', 'ly', 'al', 'ally', 'er', 'ers', 'ist', 'ists'];
const ISE = ['apologis', 'realis', 'recognis', 'organis', 'criticis', 'memoris', 'emphasis', 'summaris', 'specialis', 'customis', 'finalis', 'prioritis', 'authoris', 'civilis', 'capitalis', 'familiaris', 'alphabetis', 'normalis', 'minimis', 'maximis', 'sympathis', 'hospitalis', 'visualis', 'socialis', 'stabilis', 'utilis', 'idealis', 'jeopardis', 'penalis', 'scrutinis', 'symbolis', 'harmonis', 'mobilis', 'modernis', 'patronis', 'personalis', 'popularis', 'randomis', 'revolutionis', 'standardis', 'sterilis', 'synchronis', 'terroris', 'theoris', 'paralys', 'reorganis', 'unauthoris', 'materialis', 'legalis', 'commercialis', 'sensitis', 'energis', 'subsidis', 'merchandis'];
const ISE_SUF = ['e', 'ed', 'es', 'ing', 'ation', 'ations', 'er', 'ers', 'able', 'ably'];
const RE = ['centre', 'centimetre', 'kilometre', 'metre', 'litre', 'millilitre', 'theatre', 'fibre', 'sombre', 'spectre', 'calibre', 'meagre', 'lustre'];
const RE_SUF = ['', 's', 'd'];

function build(): { shared: Table; us: Table; ca: Table; uk: Table } {
  const shared: Table = new Map();
  const us: Table = new Map();
  const ca: Table = new Map();
  const uk: Table = new Map();

  // -ise → -ize: American and Canadian (analyse → analyze too)
  for (const stem of ISE) {
    const to = stem.slice(0, -2) + (stem === 'paralys' ? 'yz' : 'iz');
    family(shared, stem, to, ISE_SUF);
    // British readers want the -ise forms back (the content mixes both)
    for (const suf of ISE_SUF) uk.set(to + suf, stem + suf);
  }
  family(shared, 'analys', 'analyz', ['e', 'ed', 'ing']);
  family(uk, 'analyz', 'analys', ['e', 'ed', 'ing']);
  // practise → practice, practised → practiced (American only: Canadians keep the verb practise)
  family(us, 'practis', 'practic', ['e', 'ed', 'es', 'ing']);

  // -our → -or (American only; Canada keeps -our). The reverse for British readers.
  for (const stem of OUR) {
    const to = stem.replace('our', 'or');
    family(us, stem, to, OUR_SUF);
    if (stem !== 'saviour') for (const suf of OUR_SUF) uk.set(to + suf, stem + suf);
  }
  for (const stem of RE) {
    const to = stem.replace(/re$/, 'er');
    family(us, stem, to, RE_SUF);
    if (stem !== 'metre' && stem !== 'litre') for (const suf of RE_SUF) uk.set(to + suf, stem + suf);
  }

  // doubled consonants and other American-only spellings
  const usOnly: [string, string][] = [
    ['travelling', 'traveling'], ['traveller', 'traveler'], ['travellers', 'travelers'], ['travelled', 'traveled'],
    ['cancelled', 'canceled'], ['cancelling', 'canceling'], ['labelled', 'labeled'], ['labelling', 'labeling'],
    ['modelled', 'modeled'], ['modelling', 'modeling'], ['signalled', 'signaled'], ['signalling', 'signaling'],
    ['levelled', 'leveled'], ['fuelled', 'fueled'], ['totalled', 'totaled'], ['marshalled', 'marshaled'],
    ['unravelling', 'unraveling'], ['jeweller', 'jeweler'], ['jewellers', 'jewelers'], ['jewellery', 'jewelry'],
    ['counsellor', 'counselor'], ['counsellors', 'counselors'], ['counselling', 'counseling'],
    ['skilful', 'skillful'], ['wilful', 'willful'],
    ['fulfil', 'fulfill'], ['fulfils', 'fulfills'], ['enrol', 'enroll'], ['instalment', 'installment'], ['instalments', 'installments'],
    ['licence', 'license'], ['licences', 'licenses'], ['defence', 'defense'], ['offence', 'offense'], ['offences', 'offenses'], ['pretence', 'pretense'],
    ['grey', 'gray'], ['greyer', 'grayer'], ['greyest', 'grayest'], ['greying', 'graying'], ['greyish', 'grayish'],
    ['cheque', 'check'], ['cheques', 'checks'], ['moustache', 'mustache'], ['moustaches', 'mustaches'],
    ['aluminium', 'aluminum'], ['ageing', 'aging'], ['judgement', 'judgment'], ['aeroplane', 'airplane'], ['aeroplanes', 'airplanes'],
    ['sceptical', 'skeptical'], ['sceptic', 'skeptic'], ['mould', 'mold'], ['moulds', 'molds'], ['plough', 'plow'],
    ['draught', 'draft'], ['draughts', 'drafts'], ['storey', 'story'], ['storeys', 'stories'], ['towards', 'toward'],
    ['amongst', 'among'], ['paediatric', 'pediatric'], ['orthopaedic', 'orthopedic'], ['diarrhoea', 'diarrhea'], ['anaemia', 'anemia'],
    ['kerbs', 'curbs'], ['maths', 'math'],
  ];
  for (const [a, b] of usOnly) us.set(a, b);

  // vocabulary and spellings American and Canadian share
  const both: [string, string][] = [
    ['mum', 'mom'], ['mums', 'moms'], ['mummy', 'mommy'], ['pram', 'stroller'], ['prams', 'strollers'],
    ['nappy', 'diaper'], ['nappies', 'diapers'], ['rubbish', 'garbage'], ['petrol', 'gas'], ['pavement', 'sidewalk'], ['pavements', 'sidewalks'],
    ['motorway', 'highway'], ['motorways', 'highways'], ['lorry', 'truck'], ['lorries', 'trucks'], ['jumper', 'sweater'], ['jumpers', 'sweaters'],
    ['trainers', 'sneakers'], ['crisps', 'chips'], ['biscuit', 'cookie'], ['biscuits', 'cookies'], ['sweets', 'candy'], ['fringe', 'bangs'],
    ['torchlight', 'flashlight'], ['takeaway', 'takeout'], ['takeaways', 'takeouts'], ['flatmate', 'roommate'], ['flatmates', 'roommates'], ['headmaster', 'principal'], ['headmistress', 'principal'],
    ['queue', 'line'], ['queues', 'lines'], ['torch', 'flashlight'], ['torches', 'flashlights'], ['tyre', 'tire'], ['tyres', 'tires'], ['kerb', 'curb'],
    ['pyjamas', 'pajamas'], ['dreamt', 'dreamed'], ['learnt', 'learned'], ['spelt', 'spelled'], ['leapt', 'leaped'], ['spoilt', 'spoiled'],
    ['whilst', 'while'], ['programme', 'program'], ['programmes', 'programs'], ['cosy', 'cozy'],
  ];
  for (const [a, b] of both) shared.set(a, b);
  // spellings Canadians keep, so only the American table has them (cheque, grey, moustache, centre, licence, -our, double l)

  // British readers: the American words back
  const ukBack: [string, string][] = [
    ['mom', 'mum'], ['moms', 'mums'], ['mommy', 'mummy'], ['gray', 'grey'], ['grayer', 'greyer'], ['grayest', 'greyest'], ['graying', 'greying'],
    ['sidewalk', 'pavement'], ['sidewalks', 'pavements'], ['diaper', 'nappy'], ['diapers', 'nappies'], ['sneakers', 'trainers'], ['candy', 'sweets'],
    ['trash', 'rubbish'], ['garbage', 'rubbish'], ['vacation', 'holiday'], ['vacations', 'holidays'], ['math', 'maths'], ['stroller', 'pram'], ['strollers', 'prams'],
    ['roommate', 'flatmate'], ['roommates', 'flatmates'], ['bangs', 'fringe'], ['flashlight', 'torch'], ['flashlights', 'torches'], ['pajamas', 'pyjamas'],
    ['curb', 'kerb'], ['tire', 'tyre'], ['tires', 'tyres'], ['toward', 'towards'], ['aging', 'ageing'], ['learned', 'learnt'],
  ];
  // "tire" is also a verb, "curb" a verb, "bangs" a noun in other senses, "learned" an adjective: keep only the safe ones
  for (const [a, b] of ukBack) if (!['tire', 'tires', 'curb', 'bangs', 'learned', 'aging', 'toward'].includes(a)) uk.set(a, b);
  return { shared, us, ca, uk };
}

const TABLES = build();

// ---------------------------------------------------------------- phrase rules

type Rule = [RegExp, string | ((m: string, ...g: string[]) => string)];

// a flat is an apartment, but not "fell flat", "a flat tyre" or "ironed flat"
const NOT_FLAT = '(?![ -](?:tyre|tire|battery|white|screen|rate|fee|note|shoes|surface|line|road|pack|bread|rock|cap|beer|soda|stone|out\\b))';
const FLAT_ADJ = '(?:the|each|every|another|same|other|whole|entire|your|my|his|her|their|our|new|small|shared|first|own|this|that|old|tiny|rented|little|cheap|bigger|nicer|one-bedroom|two-bedroom|three-bedroom|studio|top-floor|ground-floor)';
const SHARED_RULES: Rule[] = [
  [/\b(a|A) block of flats\b/g, (_m, a) => (a === 'A' ? 'An apartment building' : 'an apartment building')],
  [/\bblocks of flats\b/g, 'apartment buildings'],
  [new RegExp(`\\b(A|a) flat\\b${NOT_FLAT}`, 'g'), (_m, a) => (a === 'A' ? 'An apartment' : 'an apartment')],
  [new RegExp(`\\b(${FLAT_ADJ}) flat\\b${NOT_FLAT}`, 'gi'), (_m, adj) => `${adj} apartment`],
  [new RegExp(`\\b(${FLAT_ADJ}) flats\\b`, 'gi'), (_m, adj) => `${adj} apartments`],
  [/([$€£₺¥]\s?[\d.,]+[kKmM]?) flat\b/g, '$1 apartment'],
  [/\b(build|building|built|buy|buying|bought|rent|renting|rented|sell|selling|sold|own|owning|owned|owns) flats\b/gi, (_m, v) => `${v} apartments`],
  [/\bflats and\b/gi, 'apartments and'],
  [/\bhead ?teacher\b/gi, 'principal'],
  [/\bprimary school\b/g, 'elementary school'],
  [/\bPrimary school\b/g, 'Elementary school'],
  [/\b[Pp]rimary School\b/g, 'Elementary School'],
  [/\bcar boot\b/g, 'trunk'],
  [/\bcar park\b/g, 'parking lot'],
  [/\bon holiday\b/g, 'on vacation'],
  [/\bOn holiday\b/g, 'On vacation'],
  [/\bBest holiday ever\b/g, 'Best vacation ever'],
  [/\bholiday (trip|plan|plans|home|photos)\b/g, 'vacation $1'],
  [/\bthe cinema\b/g, 'the movies'],
  [/\bmobile phone(s?)\b/g, 'cell phone$1'],
  [/\bqueued up\b/g, 'lined up'],
  [/\bqueue(?:d|ing)\b/g, (m) => (m === 'queueing' ? 'waiting in line' : 'waited in line')],
];
const US_RULES: Rule[] = [[/\bholiday cottage\b/g, 'vacation cottage'], [/\bpostcode\b/gi, 'zip code']];
const CA_RULES: Rule[] = [[/\bholiday cottage\b/g, 'cottage'], [/\bpostcode\b/gi, 'postal code']];
const UK_RULES: Rule[] = [
  [/\belementary school\b/g, 'primary school'],
  [/\bElementary school\b/g, 'Primary school'],
  [/\bgas station\b/g, 'petrol station'],
  [/\bcell phone\b/g, 'mobile phone'],
  [/\bparking lot\b/g, 'car park'],
  [/\bzip code\b/gi, 'postcode'],
];

// ---------------------------------------------------------------- the function

/** Keeps the shape of the original: "Mom" → "Mum", "MOM" → "MUM", "mom" → "mum". */
function matchCase(src: string, repl: string): string {
  if (src.length > 1 && src === src.toUpperCase()) return repl.toUpperCase();
  if (src[0] !== src[0].toLowerCase()) return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}

const WORD = /[A-Za-z]+/g;
const IDIOM_BEFORE = /\b(pass(?:ed|es|ing)?|carry|carried|carries|carrying|hand(?:ed|s|ing)?|bear|bore|bears)\s+(?:on\s+|down\s+|over\s+)?(?:the\s+|a\s+|your\s+|his\s+|her\s+|their\s+|our\s+)?$/i;

function lookupFor(d: Dialect): (w: string) => string | undefined {
  const { shared, us, ca, uk } = TABLES;
  if (d === 'us') return (w) => us.get(w) ?? shared.get(w);
  if (d === 'ca') return (w) => ca.get(w) ?? shared.get(w);
  return (w) => uk.get(w);
}
const LOOKUP: Record<Dialect, (w: string) => string | undefined> = { us: lookupFor('us'), ca: lookupFor('ca'), uk: lookupFor('uk') };
/** Cheap test: most lines contain none of the phrases, so the phrase rules are skipped for them. */
const TRIGGER: Record<Dialect, RegExp> = {
  us: /flat|primary|head ?teacher|car boot|car park|holiday|cinema|queue|mobile phone|postcode/i,
  ca: /flat|primary|head ?teacher|car boot|car park|holiday|cinema|queue|mobile phone|postcode/i,
  uk: /elementary|gas station|cell phone|parking lot|zip code/i,
};
const RULES: Record<Dialect, Rule[]> = { us: [...SHARED_RULES, ...US_RULES], ca: [...SHARED_RULES, ...CA_RULES], uk: UK_RULES };

/** English text as it is spelled and worded in the dialect of the country the life is lived in. */
export function localizeEn(text: string, countryId: string): string {
  if (!text) return text;
  const d = dialectOf(countryId);
  let out = text;
  // phrase rules first: "mobile phone" and "primary school" are two words, the word table only sees one
  if (TRIGGER[d].test(out)) for (const [re, to] of RULES[d]) out = out.replace(re, to as never);
  const look = LOOKUP[d];
  return out.replace(WORD, (w, offset: number, whole: string) => {
    const r = look(w.toLowerCase());
    if (r === undefined) return w;
    // "flat-pack" furniture is the same in every dialect
    if (/^flat$/i.test(w) && /^-?pack/i.test(whole.slice(offset + w.length, offset + w.length + 6))) return w;
    // "passed the torch" is the idiom (the dynasty hand-over), not the lamp: it is written "torch" everywhere
    if (/^torch(es)?$/i.test(w) && IDIOM_BEFORE.test(whole.slice(Math.max(0, offset - 40), offset))) return w;
    return matchCase(w, r);
  });
}
