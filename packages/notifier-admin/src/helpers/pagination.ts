interface Pagination {
  skip: number;
  take: number;
}
/**
 *
/** Get and enforce correctness of urls pagination searchParams.
 *
 * @param url utl to parse
 * @param defaultTake take to use, if url's take param is not defined or invalid
 * @returns pagination data
 */
export function getPaginationParams(url: URL, defaultTake = 20): Pagination {
  const page = coerceParam(url.searchParams.get("page"), 1);
  const take = coerceParam(url.searchParams.get("take"), defaultTake);

  const skip = (page - 1) * take;
  return {
    skip,
    take,
  }
}

/**
 * Appending pagination data retived from URL or passed as Pagination object
 * to url searchParams.
 *
 * If pagination data exists in the url, it will be overwritten.
 *
 * @param source Pagination data source
 * @param url url to append pagination data to
 * @returns url with pagination data appended to its search
 */
export function paginate(source: URL | Pagination, url: string): string {
  const pagination = isPagination(source)
    ? source
    : getPaginationParams(source);
  const [ search, noSearchUrl ] = extractSearch(url);

  const searchParams = new URLSearchParams(search);
  while (searchParams.has("skip")) {
    searchParams.delete("skip");
  }
  while (searchParams.has("take")) {
    searchParams.delete("take");
  }
  searchParams.set("skip", pagination.skip.toString());
  searchParams.set("take", pagination.take.toString());

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

function isPagination(obj: unknown): obj is Pagination {
  return !!(
    obj && typeof obj === "object" &&
    validate(obj, "skip", 0) &&
    validate(obj, "take", 1)
  )
}

function validate<T extends object>(obj: T, field: string, minVal: number): boolean {
  const val = obj[field as keyof T];
  return (Number.isInteger(val) && val >= minVal);
}

function coerceParam(p: number | string | null, defaultValue: number): number {
  const val = Number(p);
  if (!Number.isInteger(val) || val < 1) {
    return defaultValue;
  }
  return val;
}

