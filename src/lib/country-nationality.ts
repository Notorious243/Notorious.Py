import countries from 'i18n-iso-countries';
import frCountryLocale from 'i18n-iso-countries/langs/fr.json';

countries.registerLocale(frCountryLocale);

export type CountryOption = {
  code: string;
  label: string;
  flag: string;
  searchLabel: string;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const countryFlagFromCode = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  rdc: 'République démocratique du Congo',
  usa: "États-Unis d'Amérique",
  uk: 'Royaume-Uni',
};

const NATIONALITY_LABEL_OVERRIDES: Record<string, string> = {
  AE: 'Émiratie',
  AF: 'Afghane',
  AL: 'Albanaise',
  AM: 'Arménienne',
  AO: 'Angolaise',
  AR: 'Argentine',
  AT: 'Autrichienne',
  AU: 'Australienne',
  AZ: 'Azerbaïdjanaise',
  BA: 'Bosniaque',
  BE: 'Belge',
  BF: 'Burkinabè',
  BG: 'Bulgare',
  BI: 'Burundaise',
  BJ: 'Béninoise',
  BR: 'Brésilienne',
  BS: 'Bahaméenne',
  BW: 'Botswanaise',
  BY: 'Biélorusse',
  CA: 'Canadienne',
  CD: 'Congolaise (RDC)',
  CF: 'Centrafricaine',
  CG: 'Congolaise (Congo)',
  CH: 'Suisse',
  CI: 'Ivoirienne',
  CL: 'Chilienne',
  CM: 'Camerounaise',
  CN: 'Chinoise',
  CO: 'Colombienne',
  CR: 'Costaricienne',
  CU: 'Cubaine',
  CV: 'Cap-verdienne',
  CY: 'Chypriote',
  CZ: 'Tchèque',
  DE: 'Allemande',
  DJ: 'Djiboutienne',
  DK: 'Danoise',
  DO: 'Dominicaine',
  DZ: 'Algérienne',
  EC: 'Équatorienne',
  EE: 'Estonienne',
  EG: 'Égyptienne',
  ER: 'Érythréenne',
  ES: 'Espagnole',
  ET: 'Éthiopienne',
  FI: 'Finlandaise',
  FR: 'Française',
  GA: 'Gabonaise',
  GB: 'Britannique',
  GE: 'Géorgienne',
  GH: 'Ghanéenne',
  GN: 'Guinéenne',
  GQ: 'Équato-guinéenne',
  GR: 'Grecque',
  GW: 'Bissau-guinéenne',
  HT: 'Haïtienne',
  HR: 'Croate',
  HU: 'Hongroise',
  ID: 'Indonésienne',
  IE: 'Irlandaise',
  IL: 'Israélienne',
  IN: 'Indienne',
  IQ: 'Irakienne',
  IR: 'Iranienne',
  IS: 'Islandaise',
  IT: 'Italienne',
  JM: 'Jamaïcaine',
  JO: 'Jordanienne',
  JP: 'Japonaise',
  KE: 'Kényane',
  KH: 'Cambodgienne',
  KM: 'Comorienne',
  KP: 'Nord-coréenne',
  KR: 'Sud-coréenne',
  KZ: 'Kazakhe',
  LB: 'Libanaise',
  LK: 'Sri-lankaise',
  LR: 'Libérienne',
  LT: 'Lituanienne',
  LU: 'Luxembourgeoise',
  LV: 'Lettone',
  LY: 'Libyenne',
  MA: 'Marocaine',
  MD: 'Moldave',
  MG: 'Malgache',
  MK: 'Macédonienne',
  ML: 'Malienne',
  MM: 'Birmane',
  MN: 'Mongole',
  MR: 'Mauritanienne',
  MT: 'Maltaise',
  MU: 'Mauricienne',
  MW: 'Malawienne',
  MX: 'Mexicaine',
  MY: 'Malaisienne',
  MZ: 'Mozambicaine',
  NA: 'Namibienne',
  NE: 'Nigérienne',
  NG: 'Nigériane',
  NI: 'Nicaraguayenne',
  NL: 'Néerlandaise',
  NO: 'Norvégienne',
  NP: 'Népalaise',
  NZ: 'Néo-zélandaise',
  PE: 'Péruvienne',
  PH: 'Philippine',
  PK: 'Pakistanaise',
  PL: 'Polonaise',
  PT: 'Portugaise',
  QA: 'Qatarienne',
  RO: 'Roumaine',
  RS: 'Serbe',
  RU: 'Russe',
  RW: 'Rwandaise',
  SA: 'Saoudienne',
  SD: 'Soudanaise',
  SE: 'Suédoise',
  SG: 'Singapourienne',
  SI: 'Slovène',
  SK: 'Slovaque',
  SL: 'Sierra-léonaise',
  SN: 'Sénégalaise',
  SO: 'Somalienne',
  SS: 'Sud-soudanaise',
  SY: 'Syrienne',
  TD: 'Tchadienne',
  TG: 'Togolaise',
  TH: 'Thaïlandaise',
  TN: 'Tunisienne',
  TR: 'Turque',
  TZ: 'Tanzanienne',
  UA: 'Ukrainienne',
  UG: 'Ougandaise',
  US: 'Américaine',
  UY: 'Uruguayenne',
  UZ: 'Ouzbèke',
  VE: 'Vénézuélienne',
  VN: 'Vietnamienne',
  YE: 'Yéménite',
  ZA: 'Sud-africaine',
  ZM: 'Zambienne',
  ZW: 'Zimbabwéenne',
};

const countryNameEntries = Object.entries(countries.getNames('fr')) as [string, string][];

export const COUNTRY_OPTIONS: CountryOption[] = countryNameEntries
  .map(([code, label]) => ({
    code,
    label,
    flag: countryFlagFromCode(code),
    searchLabel: normalizeText(`${code} ${label}`),
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

export const NATIONALITY_OPTIONS: CountryOption[] = COUNTRY_OPTIONS.map((entry) => ({
  ...entry,
  label: NATIONALITY_LABEL_OVERRIDES[entry.code] ?? entry.label,
  searchLabel: normalizeText(`${entry.code} ${NATIONALITY_LABEL_OVERRIDES[entry.code] ?? entry.label}`),
})).sort((a, b) => a.label.localeCompare(b.label, 'fr'));

const countryLookup = new Map<string, string>();
for (const option of COUNTRY_OPTIONS) {
  countryLookup.set(normalizeText(option.label), option.label);
  countryLookup.set(normalizeText(option.code), option.label);
}
for (const [alias, label] of Object.entries(COUNTRY_NAME_ALIASES)) {
  countryLookup.set(normalizeText(alias), label);
}

const nationalityLookup = new Map<string, string>();
for (const option of NATIONALITY_OPTIONS) {
  nationalityLookup.set(normalizeText(option.label), option.label);
  nationalityLookup.set(normalizeText(option.code), option.label);
}

export const normalizeCountryLabel = (value: string) =>
  countryLookup.get(normalizeText(value)) ?? value;

export const normalizeNationalityLabel = (value: string) =>
  nationalityLookup.get(normalizeText(value)) ?? value;

