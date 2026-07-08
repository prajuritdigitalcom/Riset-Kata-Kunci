/**
 * Google Suggest service helper
 */

let useJSONPOnly = false;

/**
 * Dynamic JSONP implementation for client-side direct request to Google Suggest.
 * Bypasses CORS constraints on Vercel/GitHub Pages where there is no backend server.
 */
function fetchSuggestionsJSONP(
  query: string,
  hl: string = "id",
  gl: string = "id"
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Generate a unique global callback name
    const callbackId = "googleSuggestCallback_" + Math.random().toString(36).substring(2, 15);
    
    // Set a timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP request timed out"));
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      delete (window as any)[callbackId];
      const script = document.getElementById(callbackId);
      if (script) {
        script.remove();
      }
    };

    // Define the global callback function
    (window as any)[callbackId] = (data: any) => {
      cleanup();
      try {
        const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
        resolve(suggestions);
      } catch (err) {
        reject(err);
      }
    };

    const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(query)}&jsonp=${callbackId}`;

    const script = document.createElement("script");
    script.id = callbackId;
    script.src = url;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP script load error (possibly blocked by browser)"));
    };

    document.head.appendChild(script);
  });
}

/**
 * Fetches suggestions from our Express backend API.
 * Implements standard retrying if the request fails.
 * 
 * @param query The search query to autocomplete
 * @param retries Number of retries allowed
 * @returns Array of suggested keyword strings
 */
export async function fetchSuggestions(
  query: string,
  retries: number = 2,
  hl: string = "id",
  gl: string = "id"
): Promise<string[]> {
  if (useJSONPOnly) {
    return fetchSuggestionsJSONP(query, hl, gl);
  }

  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const response = await fetch(
        `/api/suggest?q=${encodeURIComponent(query)}&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}`
      );
      if (!response.ok) {
        // If we get a 404, it means the API route doesn't exist on this host (e.g., deployed as static Vite build on Vercel).
        // Instantly switch to client-side JSONP to bypass CORS.
        if (response.status === 404) {
          console.warn("Backend API returned 404. Falling back to direct client-side JSONP...");
          useJSONPOnly = true;
          return fetchSuggestionsJSONP(query, hl, gl);
        }
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      // If it's a TypeError (failed to fetch, e.g. network error / server offline), let's fall back to JSONP right away.
      if (error instanceof TypeError) {
        console.warn("Backend API fetch failed (offline or network error). Falling back to direct client-side JSONP...", error);
        useJSONPOnly = true;
        return fetchSuggestionsJSONP(query, hl, gl);
      }

      attempt++;
      if (attempt > retries) {
        console.error(`Failed fetching suggest for "${query}" after ${retries} retries, trying JSONP...`, error);
        // Last-resort fallback to JSONP before completely failing
        try {
          return await fetchSuggestionsJSONP(query, hl, gl);
        } catch (jsonpErr) {
          throw error; // throw original backend error if JSONP also fails
        }
      }
      // Wait slightly before retrying (e.g., 300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  
  return [];
}
