import { createClient } from "./server";
import { Env } from "../..";
import { createResponseWithCookies, parseFormData, redirectWithError } from "./utils";
import { z } from "zod";

const formDataSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

/**
 * Handle login form submission and redirect to the dashboard after successful login
 */
export async function login(env: Env, request: Request) {

    // Create a Supabase client and get the headers
    const { supabase, cookies } = await createClient(request);
    const formData = await request.formData();

    // Attempt to parse the form data
    const parsedFormData = parseFormData(formData, formDataSchema);

    if (!parsedFormData) {
        return redirectWithError("/login", "Invalid form data");
    }

    // Attempt to sign in with the form data
    const { error } = await supabase.auth.signInWithPassword(parsedFormData);
    
    if (error) {
        console.log(error.name, error.code, error.status);
        return redirectWithError("/login", "Invalid email or password");
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
    const parsedFormData = parseFormData(formData, formDataSchema);

    if (!parsedFormData) {
        return redirectWithError("/signup", "Invalid form data");
    }

    // Attempt to sign up with the form data
    const { error, data } = await supabase.auth.signUp(parsedFormData);
    
    if (error) {
        return redirectWithError("/signup", "An error occurred while signing up");
    }

    // Update the database with the user's information
    await env.FP_DATA_API.createUser({
        email: data.user?.email || parsedFormData.email,
        id: data.user?.id, // uuid in the auth database
    })
    .catch((error) => {
        console.error(error);
    });

    // Redirect to onboarding if successful and set the cookie
    return createResponseWithCookies(new Response(null, {
        status: 302,
        headers: {
            "Location": "/onboarding",
        },
    }), cookies);
}