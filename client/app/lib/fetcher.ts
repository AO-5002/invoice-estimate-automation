export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function resolve(path: string): string {
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

export async function fetcher<T>(path: string): Promise<T> {
  const url = resolve(path);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch a binary resource (e.g. a generated PDF) and return it as a Blob. Throws on a non-OK status. */
export async function fetchBlob(path: string): Promise<Blob> {
  const url = resolve(path);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`);
  }

  return res.blob();
}

/** POST a JSON body and parse the JSON response. Throws on a non-OK status. */
export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const url = resolve(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`POST ${url} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** PATCH a JSON body. Expects an empty (204) response, so nothing is parsed. Throws on non-OK. */
export async function patchJSON(path: string, body: unknown): Promise<void> {
  const url = resolve(path);
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`PATCH ${url} failed with status ${res.status}`);
  }
}
