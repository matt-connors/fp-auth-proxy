import { getPrimaryPath } from "./utils";
import { Env } from "..";

/**
 * Handle creating a new program 
 */
export async function handleProgramEdit(env: Env, request: Request, continueRequest: any): Promise<Response> {

    const programId = getPrimaryPath(request)[3];

    // If the user is trying to edit an existing program, continue the request
    if (programId) {
        return continueRequest(env, request);
    }

    // create a new program
    const response = await env.FP_DATA_API.createProgram()
        .catch((error: any) => {
            console.error(`Error creating new program: ${error}`);
            // Redirect the user to the programs page to try again
            return new Response(null, {
                status: 302,
                headers: {
                    "Location": "/trainer/programs",
                },
            });
        });

    // Redirect the user to the edit page for the new program
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/trainer/programs/edit/" + response.id,
        },
    });

}

/**
 * Handle assigning a program to a user
 */
export async function handleAssignProgram(env: Env, request: Request): Promise<Response> {

    const programId = getPrimaryPath(request)[1] || '';
    const userId = getPrimaryPath(request)[2];

    if (!programId || !userId) {
        // Redirect the user to the programs page to try again
        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/trainer/programs?message=Invalid%20program%20or%20user%20id&variant=destructive",
            },
        });
    }

    // If the user is trying to assign a program to a user, continue the request
    await env.FP_DATA_API.assignProgramToUser(parseInt(programId), userId);

    // Redirect the user to the programs page with a success message
    return new Response(null, {
        status: 302,
        headers: {
            "Location": "/trainer/programs?message=Program%20assigned%20successfully&variant=default",
        },
    });

}