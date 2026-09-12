import type {
  PublicationRecord,
  UserRecord,
  CreatePublicationInput,
  CreateUserInput,
} from "@/lib/supabase/types";

export type {
  PublicationRecord,
  UserRecord,
  CreatePublicationInput,
  CreateUserInput,
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export type PublicationData = { publication: PublicationRecord } & PublicationRecord;
export type UserData = { user: UserRecord } & UserRecord;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "/api") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const res = await fetch(`${this.baseUrl}${cleanPath}`);
      const data = await res.json();
      if (!res.ok) {
        return {
          data,
          error: data?.error || `Request failed with status ${res.status}`,
          status: res.status,
        };
      }
      return { data, status: res.status };
    } catch (err: any) {
      return { error: err?.message || "Network error", status: 500 };
    }
  }

  async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
    try {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      const res = await fetch(`${this.baseUrl}${cleanPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          data,
          error: data?.error || `Request failed with status ${res.status}`,
          status: res.status,
        };
      }
      return { data, status: res.status };
    } catch (err: any) {
      return { error: err?.message || "Network error", status: 500 };
    }
  }

  async getPublications(
    creatorWallet?: string
  ): Promise<ApiResponse<{ publications: PublicationRecord[] }>> {
    const query = creatorWallet
      ? `?creatorWallet=${encodeURIComponent(creatorWallet)}`
      : "";
    return this.get<{ publications: PublicationRecord[] }>(`/publications${query}`);
  }

  async getPublication(
    id: string
  ): Promise<ApiResponse<PublicationData>> {
    return this.get<PublicationData>(
      `/publications/${encodeURIComponent(id)}`
    );
  }

  async createPublication(
    data: CreatePublicationInput
  ): Promise<ApiResponse<PublicationData>> {
    return this.post<PublicationData>("/publications", data);
  }

  async getUser(wallet: string): Promise<ApiResponse<UserData>> {
    return this.get<UserData>(`/users/${encodeURIComponent(wallet)}`);
  }

  async upsertUser(
    data: CreateUserInput
  ): Promise<ApiResponse<UserData>> {
    return this.post<UserData>("/users", data);
  }
}

export const apiClient = new ApiClient();
