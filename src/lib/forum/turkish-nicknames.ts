const FIRST_NAMES = [
  "ayse",
  "mehmet",
  "ahmet",
  "zeynep",
  "elif",
  "can",
  "burak",
  "deniz",
  "emre",
  "selin",
  "fatma",
  "mustafa",
  "hakan",
  "ozge",
  "mert",
  "ece",
  "berk",
  "yasemin",
  "kerem",
  "sude",
  "onur",
  "pinar",
  "cem",
  "gizem",
  "baris",
  "irem",
  "tolga",
  "dilara",
] as const;

const LAST_NAMES = [
  "yilmaz",
  "kaya",
  "demir",
  "celik",
  "sahin",
  "yildiz",
  "ozturk",
  "aydin",
  "arslan",
  "dogan",
  "kilic",
  "aslan",
  "cetin",
  "koc",
  "kurt",
  "ozkan",
  "simsek",
  "polat",
  "aksoy",
  "karaca",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function generateTurkishForumNickname(): string {
  const first = pickRandom(FIRST_NAMES);
  const last = pickRandom(LAST_NAMES);
  const digits = Math.floor(10 + Math.random() * 90).toString();
  return `${first}${last}${digits}`;
}
