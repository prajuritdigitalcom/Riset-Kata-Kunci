/**
 * Google Suggest service helper
 */

/**
 * Fetches suggestions from our Express backend API.
 * Implements standard retrying if the request fails.
 * 
 * @param query The search query to autocomplete
 * @param retries Number of retries allowed
 * @returns Array of suggested keyword strings
 */
export async function fetchSuggestions(query: string, retries: number = 2): Promise<string[]> {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        console.error(`Failed fetching suggest for "${query}" after ${retries} retries:`, error);
        throw error;
      }
      // Wait slightly before retrying (e.g., 300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  
  return [];
}
