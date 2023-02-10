type SearchValue = string | number | Array<string | number> | null;

export function patchSearch(url: string, param: string, value: SearchValue): string;
export function patchSearch(url: string, params: Record<string, SearchValue>): string;
export function patchSearch(
  url: string,
  params_or_param: Record<string, SearchValue> | string,
  value?: SearchValue,
): string {
  const params = typeof params_or_param === "string"
    ? { [params_or_param]: value }
    : params_or_param;

  const [ search, noSearchUrl ] = extractSearch(url);
  const searchParams = new URLSearchParams(search);

  for (const [key, val] of Object.entries(params)) {
    while (searchParams.has(key)) {
      searchParams.delete(key);
    }
    const vals = Array.isArray(val) ? val : [ val ];
    vals.forEach((v) => {
      if (v != null) {
        searchParams.set(key, v.toString());
      }
    })
  }

  let hashIndex = noSearchUrl.lastIndexOf("#");
  if (hashIndex < 0) {
    hashIndex = noSearchUrl.length;
  }

  return (
    noSearchUrl.substring(0, hashIndex) +
    `?${searchParams}` +
    noSearchUrl.substring(hashIndex)
  );
}


function extractSearch(url: string): [
  search: string,
  urlWithoutSearch: string,
]{
  let searchEnd = url.indexOf('#');
  if (searchEnd < 0) {
    searchEnd = url.length;
  }
  let searchStart = url.lastIndexOf('?', searchEnd);
  if (searchStart < 0) {
    searchStart = searchEnd;
  }

  return [
    url.substring(searchStart, searchEnd),
    url.substring(0, searchStart) + url.substring(searchEnd),
  ];
}