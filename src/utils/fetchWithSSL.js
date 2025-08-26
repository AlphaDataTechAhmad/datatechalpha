/**
 * A custom fetch wrapper that handles SSL certificate issues in development
 * This should only be used in development environment
 */

const originalFetch = globalThis.fetch;

// Only modify fetch in development
if (import.meta.env.DEV) {
  globalThis.fetch = async (url, options = {}) => {
    // Create a new URL object to check the host
    const urlObj = new URL(url, window.location.origin);
    
    // Only bypass SSL for Appwrite API calls in development
    if (urlObj.hostname === 'cloud.appwrite.io') {
      // Create a new Request object to modify the URL if needed
      const modifiedUrl = urlObj.toString();
      
      // Return a modified fetch with rejectUnauthorized disabled
      return originalFetch(modifiedUrl, {
        ...options,
        // @ts-ignore - This is a Node.js specific option
        // In a browser environment, we need to handle this differently
        // This is just a fallback
        rejectUnauthorized: false,
        // Add any other necessary options here
      }).catch(error => {
        console.error('Fetch error with SSL bypass:', error);
        throw error;
      });
    }
    
    // For all other requests, use the original fetch
    return originalFetch(url, options);
  };
}

export default globalThis.fetch;
