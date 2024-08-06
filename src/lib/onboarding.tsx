import { z } from "zod";
import { parseFormData } from "./supabase/utils";
import { Env } from "..";

// Define the schema for the trainer form data
const trainerFormDataSchema = z.object({
    "Business Name": z.string().min(2),
    "First Name": z.string(),
    "Last Name": z.string(),
    "Phone Number": z.string().min(10).max(10).regex(/^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/),
    "Country": z.string(),
});

// Define the schema for the client form data
const clientFormDataSchema = z.object({});

/**
 * Handle onboarding for trainers
 */
export async function handleTrainerOnboarding(env: Env, request: Request): Promise<Response> {
    const formData = await request.formData();
    const parsedFormData = parseFormData(formData, trainerFormDataSchema);
    const uuid = request.headers.get("X-User-Id");

    // If the form data is invalid, return a 400 response
    if (!parsedFormData) {
        return new Response("Invalid form data", { status: 400 });
    }

    // If the user ID is missing, return a 401 response
    // This should never happen, but it's good to check
    if (!uuid) {
        return new Response("User ID is required", { status: 401 });
    }

    // Initialize the trainer in the database
    await env.FP_DATA_API.initializeTrainer(uuid, parsedFormData)
        .catch((error: Error) => {
            console.error(`Error initializing trainer: ${error}`);
            // Redirect the user to the onboarding form to try again
            return new Response(null, {
                status: 302,
                headers: {
                    "Location": "/onboarding#trainer",
                },
            });
        });

    // Redirect the user to the dashboard
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/trainer",
        },
    });
}

/**
 * Handle onboarding for clients
 */
export async function handleClientOnboarding(env: Env, request: Request): Promise<Response> {
    // Redirect the user to the dashboard
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/",
        },
    });
}