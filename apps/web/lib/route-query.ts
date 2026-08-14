export function buildRouteQuery(
  params: Record<
    string,
    string | number | undefined | null
  >
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(
    params
  )) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();

  return query.length > 0 ? `?${query}` : "";
}
