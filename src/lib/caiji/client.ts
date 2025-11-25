import type { CaijiResponse, CaijiSearchParams,CaijiSource, CaijiVod } from "./types";

/**
 * CaiJi API Client
 * Handles communication with 采集站 APIs (苹果CMS v10 protocol)
 */
export class CaijiClient {
  private source: CaijiSource;
  private timeout: number;

  constructor(source: CaijiSource, timeout = 10000) {
    this.source = source;
    this.timeout = timeout;
  }

  /**
   * Search videos by keyword
   */
  async search(keyword: string, page = 1): Promise<CaijiResponse<CaijiVod>> {
    const params = new URLSearchParams({
      ac: "videolist",
      wd: keyword,
      pg: String(page),
    });

    return this.fetch(`${this.source.api}?${params.toString()}`);
  }

  /**
   * List videos with optional filters
   */
  async list(params: CaijiSearchParams = {}): Promise<CaijiResponse<CaijiVod>> {
    const searchParams = new URLSearchParams({
      ac: "videolist",
      pg: String(params.page || 1),
    });

    if (params.pageSize) {
      searchParams.set("pagesize", String(params.pageSize));
    }

    if (params.typeId) {
      searchParams.set("t", String(params.typeId));
    }

    if (params.hours) {
      searchParams.set("h", String(params.hours));
    }

    return this.fetch(`${this.source.api}?${searchParams.toString()}`);
  }

  /**
   * Get video details by ID
   */
  async getDetail(vodId: number): Promise<CaijiResponse<CaijiVod>> {
    const params = new URLSearchParams({
      ac: "detail",
      ids: String(vodId),
    });

    return this.fetch(`${this.source.api}?${params.toString()}`);
  }

  /**
   * Get multiple video details by IDs
   */
  async getDetails(vodIds: number[]): Promise<CaijiResponse<CaijiVod>> {
    const params = new URLSearchParams({
      ac: "detail",
      ids: vodIds.join(","),
    });

    return this.fetch(`${this.source.api}?${params.toString()}`);
  }

  /**
   * Get recently updated videos
   */
  async getRecent(hours = 24, page = 1): Promise<CaijiResponse<CaijiVod>> {
    return this.list({ hours, page });
  }

  /**
   * Get category list
   */
  async getCategories(): Promise<CaijiResponse<CaijiVod>> {
    const params = new URLSearchParams({
      ac: "list",
    });

    return this.fetch(`${this.source.api}?${params.toString()}`);
  }

  /**
   * Internal fetch with timeout and error handling
   */
  private async fetch<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MoonCakeTV/1.0)",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (typeof data.code === "undefined") {
        throw new Error("Invalid response: missing code field");
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get source info
   */
  getSource(): CaijiSource {
    return this.source;
  }
}
