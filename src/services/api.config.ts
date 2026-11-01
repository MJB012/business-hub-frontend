const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_BASE_URL) {
    return (window as any).__ENV__.VITE_API_BASE_URL;
  }
  return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3004';
};

export interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  if (options.data !== undefined) {
    fetchOptions.body = JSON.stringify(options.data);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message;
      }
    } catch {
      // not JSON
    }
    throw new Error(errorMessage);
  }

  // Check if response has content before parsing JSON
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}
