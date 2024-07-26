import { createClient } from "./server";
import { z } from "zod";

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
 * Handle login form submission and redirect to the dashboard after successful login
 */
export async function login(request: Request) {
    // Create a Supabase client and get the headers
    const { supabase, headers } = await createClient(request);
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
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
            "Set-Cookie": headers.get("Set-Cookie") ?? "",
        },
    });
}

/**
 * Handle logout and redirect to the login page
 */
export async function logout(request: Request) {
    // Create a Supabase client and get the headers
    const { supabase, headers } = await createClient(request);
    // Attempt to sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
        return new Response(JSON.stringify({ error }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    // Redirect to the login page if successful and update the cookie (to nothing)
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/login",
            "Set-Cookie": headers.get("Set-Cookie") ?? "",
        },
    });
}

/**
 * Handle signup form submission and redirect to the dashboard after successful signup
 */
export async function signup(request: Request) {
    // Create a Supabase client and get the headers
    const { supabase, headers } = await createClient(request);
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
    // Attempt to sign up with the form data
    const { error } = await supabase.auth.signUp(data);
    if (error) {
        return new Response(JSON.stringify({ error }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    // Redirect to the dashboard if successful and set the cookie
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
            "Set-Cookie": headers.get("Set-Cookie") ?? "",
        },
    });
}