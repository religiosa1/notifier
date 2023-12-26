import { patchSearch } from "./patchSearch";

const DEFAULT_TAKE = 20;
interface Pagination {
  skip: number;
  take: number;
}

/** Get and enforce correctness of urls pagination searchParams.
 *
 * @param url utl to parse
 * @param defaultTake take to use, if url's take param is not defined or invalid
 * @returns pagination data
 */
export function getPaginationParams(url: URL, defaultTake = DEFAULT_TAKE): Pagination {
  const page = coerceParam(url.searchParams.get("page"), 1);
  const take = coerceParam(url.searchParams.get("take"), defaultTake);

  const skip = (page - 1) * take;
  return {
    skip,
    take,
  }
}

/**
 * Appending server-side pagination data retived from URL or passed as Pagination
 * object to url searchParams.
 *
 * If pagination data exists in the url, it will be overwritten.
 *
 * @param source Pagination data source
 * @param url url to append pagination data to
 * @returns url with pagination data appended to its search
 */
export function paginate(source: URL | Pagination, url: string): string {
  const { skip, take } = isPagination(source)
    ? source
    : getPaginationParams(source);
  return patchSearch(url, { skip, take });
}

export function pageUrl(url: string, page: number): string {
  return patchSearch(url, "page", page);
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
  return (typeof val === "number" && Number.isInteger(val) && val >= minVal);
}

function coerceParam(p: number | string | null, defaultValue: number): number {
  const val = Number(p);
  if (!Number.isInteger(val) || val < 1) {
    return defaultValue;
  }
  return val;
}

