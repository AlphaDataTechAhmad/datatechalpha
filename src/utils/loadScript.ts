/**
 * Loads a script asynchronously
 * @param url - The URL of the script to load
 * @param attrs - Optional attributes to add to the script tag
 * @returns Promise that resolves when the script is loaded or rejects on error
 */
export const loadScript = (
  url: string,
  attrs: Record<string, string> = {}
): Promise<HTMLScriptElement> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve(existingScript as HTMLScriptElement);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    
    // Add any additional attributes
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    script.onload = () => resolve(script);
    script.onerror = (error) => {
      console.error(`Failed to load script: ${url}`, error);
      reject(new Error(`Failed to load script: ${url}`));
    };

    // Append to the document head
    document.head.appendChild(script);
  });
};

export default loadScript;
