/**
 * Fetches an external resource from the origin server
 */
export function fetchExternalResource({ devUrl, prodUrl }: { devUrl: string, prodUrl: string }): { fetch: (request: Request) => Promise<Response> } {
    return {
        fetch: async (request: Request) => {
            let url = new URL(request.url);
            let originRequest = new Request(request);
            // Use either the dev or prod URL based on the hostname
            let originUrl = ['localhost', '127.0.0.1'].includes(url.hostname) ? devUrl : prodUrl;
            // Fetch the resource from the origin
            let response = await fetch(`${originUrl}${url.pathname}`, originRequest);
            // Return the response if it's not a 500 error
            if (response.status !== 500) {
                return response as unknown as Response;
            }
            return new Response("Internal server error", { status: 500 });
        }
    }
}

/**
 * Get the primary path from the request URL
 */
export function getPrimaryPath(request: Request) {
    const url = new URL(request.url);
    return [...url.pathname.split('/').slice(1)];
}