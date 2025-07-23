import { API_BASE_URL } from '@/utils/constants';

import { SearchFilters, SearchResponse, SearchResult } from '@/types/search';

/**
 * Multi-factor search with comprehensive filters
 */
export const searchByFilters = async (
  filters: SearchFilters,
): Promise<SearchResponse> => {
  const {
    title = '',
    category = '',
    language = '',
    region = '',
    page = 1,
    page_size = 20,
  } = filters;

  try {
    const searchParams = new URLSearchParams();
    searchParams.set('title', title);
    searchParams.set('category', category);
    searchParams.set('language', language);
    searchParams.set('region', region);
    searchParams.set('page', page.toString());
    searchParams.set('page_size', page_size.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/search-filters?${searchParams.toString()}`,
    );
    const json = await response.json();

    const { code, message, data } = json;

    if (code !== 200) {
      throw new Error(message);
    }

    return {
      results: data.results as SearchResult[],
      total: data.total,
      page,
      pageSize: page_size,
      hasMore: data.has_more,
      sources: ['月饼TV'],
    };
  } catch (error) {
    console.log('first', error);
  }

  return {
    results: [] as SearchResult[],
    total: 0,
    page,
    pageSize: page_size,
    hasMore: false,
    sources: ['月饼TV'],
  };
};

export const searchById = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-id?id=${id}`);
    const json = await response.json();
    const { code, message, data } = json;

    if (code !== 200) {
      throw new Error(message);
    }

    return {
      results: data.results as SearchResult[],
      total: data.total,
      page: 1,
      pageSize: data.total,
      hasMore: false,
      sources: ['月饼TV'],
    };
  } catch (error) {
    console.log('first', error);
  }

  return {
    results: [] as SearchResult[],
    total: 0,
    page: 1,
    pageSize: 9999,
    hasMore: false,
    sources: ['月饼TV'],
  };
};
