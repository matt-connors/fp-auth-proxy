/**
 * Parse the form data and validate it
 */
export function parseFormData(formData: FormData, schema: any): any {
    const { data, error } = schema.safeParse(Object.fromEntries(formData));
    // If there is an error, show the error message and return early
    if (error) {
        // show error message
        console.warn("Error: ", error);
        return null;
    }
    return data;
}

/**
 * Create a response with potentailly several cookies
 */
export function createResponseWithCookies(response: Response, cookies: string[]): Response {
    const modifiedResponse = new Response(response.body, {
        status: response.status,
        headers: response.headers
    });
    for (const cookie of cookies) {
        modifiedResponse.headers.append("Set-Cookie", cookie);
    }
    return modifiedResponse;
}

/**
 * Redirect to the signup page with an error message
 */
export function redirectWithError(message: string) {
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/signup?message=" + encodeURIComponent(message),
        },
    });
}