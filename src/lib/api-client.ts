export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new ApiError(res.status, `Request failed: ${res.status}`)
  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown, headers?: Record<string, string>) =>
    request<T>(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  raw: (url: string, init?: RequestInit) => fetch(url, init),
}
