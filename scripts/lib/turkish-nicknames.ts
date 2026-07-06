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
  "oguz",
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
  "serkan",
  "busra",
  "furkan",
] as const;

const LAST_NAMES = [
  "yilmaz",
  "kaya",
  "demir",
  "celik",
  "sahin",
  "yildiz",
  "yildirim",
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
  "erdogan",
  "tas",
  "guler",
  "acar",
  "karaca",
  "unal",
  "tekin",
  "kaplan",
  "bulut",
  "aktas",
] as const;

const EMAIL_PROVIDERS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 10).toString();
  }
  return out;
}

/** isimsoyisim26 formatında görünen ad */
export function generateTurkishForumNickname(): string {
  const first = pickRandom(FIRST_NAMES);
  const last = pickRandom(LAST_NAMES);
  const digits = randomDigits(Math.random() > 0.5 ? 2 : 2);
  return `${first}${last}${digits}`;
}

/** İnsan görünümlü e-posta; bot/forum kelimesi içermez */
export function generateHumanEmail(nickname: string): string {
  const local = nickname.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const variant = Math.floor(Math.random() * 2);

  if (variant === 0) {
    return `${local}@${pickRandom(EMAIL_PROVIDERS)}`;
  }

  return `${local}${randomDigits(1)}@${pickRandom(EMAIL_PROVIDERS)}`;
}

export function generateHumanPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${pass}!`;
}

export function createRandomForumAccount(): {
  email: string;
  password: string;
  fullName: string;
} {
  const fullName = generateTurkishForumNickname();
  return {
    email: generateHumanEmail(fullName),
    password: generateHumanPassword(),
    fullName,
  };
}
