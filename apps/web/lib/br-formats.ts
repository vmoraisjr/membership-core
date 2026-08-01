function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatBrazilianCnpj(
  value: string
) {
  const digits = normalizeDigits(value).slice(
    0,
    14
  );

  return digits
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2"
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2"
    );
}

export function formatBrazilianPhone(
  value: string
) {
  const digits = normalizeDigits(value).slice(
    0,
    11
  );

  if (digits.length <= 10) {
    return digits
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  return digits
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

export function formatBrazilianZipCode(
  value: string
) {
  const digits = normalizeDigits(value).slice(
    0,
    8
  );

  return digits.replace(
    /^(\d{5})(\d)/,
    "$1-$2"
  );
}

export function formatBrazilianState(
  value: string
) {
  return value
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
}
