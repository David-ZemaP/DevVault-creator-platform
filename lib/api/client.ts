export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "/api") {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`);
      const data = await res.json();
      return { data, status: res.status };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Network error", status: 500 };
    }
  }

  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { data, status: res.status };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Network error", status: 500 };
    }
  }
}

export const apiClient = new ApiClient();
