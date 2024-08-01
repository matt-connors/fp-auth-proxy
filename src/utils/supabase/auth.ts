import { createClient } from "./server";
import { z } from "zod";
import { Env } from "../..";

const formDataSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

/**
 * Parse the form data and validate it
 */
function parseFormData(formData: FormData) {
    const { data, error } = formDataSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password")
    });
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
 * Handle login form submission and redirect to the dashboard after successful login
 */
export async function login(env: Env, request: Request) {

    // Create a Supabase client and get the headers
    const { supabase, cookies } = await createClient(request);
    const formData = await request.formData();

    // Attempt to parse the form data
    const data = parseFormData(formData);
    if (!data) {
        return new Response(JSON.stringify({ error: "Invalid form data" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // Attempt to sign in with the form data
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) {
        console.log(error.name, error.code, error.status);
        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/login?message=" + encodeURIComponent("Invalid email or password"),
            },
        });
    }

    // Redirect to the dashboard if successful and set the cookie
    return createResponseWithCookies(new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
        },
    }), cookies);
}

/**
 * Handle logout and redirect to the login page
 */
export async function logout(env: Env, request: Request) {

    // Create a Supabase client and get the headers
    const { supabase, cookies } = await createClient(request);

    // Attempt to sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.log(error);
        // redirect to the login page and clear the cookie
        return createResponseWithCookies(new Response(null, {
            status: 302,
            headers: {
                "Location": "/login",
            },
        }), cookies);
    }

    // Redirect to the login page if successful and update the cookie (to nothing)
    return createResponseWithCookies(new Response(null, {
        status: 302,
        headers: {
            "Location": "/login",
        },
    }), cookies);
}

/**
 * Handle signup form submission and redirect to the dashboard after successful signup
 */
export async function signup(env: Env, request: Request) {

    // Create a Supabase client and get the headers
    const { supabase, cookies } = await createClient(request);
    const formData = await request.formData();

    // Attempt to parse the form data
    const parsedFormData = parseFormData(formData);
    if (!parsedFormData) {
        return new Response(JSON.stringify({ error: "Invalid form data" }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // Attempt to sign up with the form data
    const { error, data } = await supabase.auth.signUp(parsedFormData);
    if (error) {
        return new Response(JSON.stringify({ error }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    // Update the database with the user's information
    await env.FP_DATA_API.createUser({
        email: data.user?.email || parsedFormData.email,
        id: data.user?.id, // uuid in the auth database
    })
    .catch((error) => {
        console.error(error);
    });

    // Redirect to the dashboard if successful and set the cookie
    return createResponseWithCookies(new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
        },
    }), cookies);
}