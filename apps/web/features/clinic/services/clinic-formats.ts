const BRAZILIAN_STATES = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

const KNOWN_CITY_STATE_MAP = new Map([
  ["aracaju", "SE"],
  ["belem", "PA"],
  ["belo horizonte", "MG"],
  ["boa vista", "RR"],
  ["brasilia", "DF"],
  ["campo grande", "MS"],
  ["cuiaba", "MT"],
  ["curitiba", "PR"],
  ["florianopolis", "SC"],
  ["fortaleza", "CE"],
  ["goiania", "GO"],
  ["joao pessoa", "PB"],
  ["macapa", "AP"],
  ["maceio", "AL"],
  ["manaus", "AM"],
  ["natal", "RN"],
  ["palmas", "TO"],
  ["porto alegre", "RS"],
  ["porto velho", "RO"],
  ["recife", "PE"],
  ["rio branco", "AC"],
  ["rio de janeiro", "RJ"],
  ["salvador", "BA"],
  ["sao luis", "MA"],
  ["sao paulo", "SP"],
  ["teresina", "PI"],
  ["vitoria", "ES"],
  ["barueri", "SP"],
  ["campinas", "SP"],
  ["guarulhos", "SP"],
  ["osasco", "SP"],
  ["santos", "SP"],
  ["santo andre", "SP"],
  ["sao bernardo do campo", "SP"],
  ["sao caetano do sul", "SP"],
  ["niteroi", "RJ"],
  ["duque de caxias", "RJ"],
  ["nova iguacu", "RJ"],
  ["contagem", "MG"],
  ["betim", "MG"],
  ["uberlandia", "MG"],
]);

export const MAX_BRANDING_LOGO_FILE_SIZE_BYTES =
  256 * 1024;
export const MAX_BRANDING_LOGO_DATA_URL_LENGTH =
  360_000;
export const MAX_BRANDING_NAME_LENGTH = 80;

const BRANDING_LOGO_DATA_URL_PATTERN =
  /^data:image\/(?:png|svg\+xml);base64,[a-zA-Z0-9+/=\s]+$/i;

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidBrazilianCnpj(
  value: string
) {
  const digits = normalizeDigits(value);

  if (
    digits.length !== 14 ||
    /^(\d)\1{13}$/.test(digits)
  ) {
    return false;
  }

  const calculateCheckDigit = (
    base: string,
    factors: number[]
  ) => {
    const total = factors.reduce(
      (sum, factor, index) =>
        sum +
        Number(base[index]) * factor,
      0
    );
    const remainder = total % 11;

    return remainder < 2
      ? 0
      : 11 - remainder;
  };

  const firstDigit =
    calculateCheckDigit(
      digits.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );
  const secondDigit =
    calculateCheckDigit(
      `${digits.slice(0, 12)}${firstDigit}`,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

  return (
    firstDigit === Number(digits[12]) &&
    secondDigit === Number(digits[13])
  );
}

export function normalizeClinicState(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeBrazilianCityName(
  value: string
) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isValidBrazilianPhone(value: string) {
  const digits = normalizeDigits(value);

  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }

  const ddd = Number(digits.slice(0, 2));

  if (!Number.isInteger(ddd) || ddd < 11 || ddd > 99) {
    return false;
  }

  return true;
}

export function isValidBrazilianZipCode(value: string) {
  return normalizeDigits(value).length === 8;
}

export function isValidBrazilianState(value: string) {
  return BRAZILIAN_STATES.has(
    normalizeClinicState(value)
  );
}

export function isKnownBrazilianCityStatePair(
  city: string,
  state: string
) {
  const normalizedCity =
    normalizeBrazilianCityName(city);
  const expectedState =
    KNOWN_CITY_STATE_MAP.get(
      normalizedCity
    );

  if (!expectedState) {
    return true;
  }

  return (
    expectedState ===
    normalizeClinicState(state)
  );
}

export function slugifyClinicName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "clinica";
}

export function isAllowedBrandingLogoSource(
  value: string
) {
  if (!value) {
    return true;
  }

  if (value.startsWith("/")) {
    return true;
  }

  return BRANDING_LOGO_DATA_URL_PATTERN.test(
    value
  );
}
