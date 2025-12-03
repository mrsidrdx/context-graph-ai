// Client-side authentication token management

const TOKEN_KEY = 'auth_token';

export const authToken = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  getAuthHeaders(): HeadersInit {
    const token = this.get();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
    };
  },
};

// Helper function to make authenticated fetch requests
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = authToken.get();
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
