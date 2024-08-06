/**
 * Cloudflare auth proxy which handles authentication and access control before forwarding requests.
 */

import { fetchExternalResource } from "./lib/request";
import { login, signup, logout } from "./lib/supabase/auth";
import { createResponseWithCookies } from "./lib/supabase/utils";
import { createClient } from "./lib/supabase/server";
import { handleClientOnboarding, handleTrainerOnboarding } from "./lib/onboarding";

type FP_DATA_API_SERVICE = Service & {
    createUser: (data: any) => Promise<any>
    initializeTrainer: (id: string, data: any) => Promise<any>
};

/**
 * Associate bindings declared in wrangler.toml with the TypeScript type system
 */
export interface Env {
    AUTH_PROXY_CACHE: DurableObjectNamespace;
    FP_DATA_API: FP_DATA_API_SERVICE;
    // environment variables
    FP_DASHBOARD_PROD_URL: string;
    FP_DASHBOARD_DEV_URL: string;
}

/**
 * Durable object class for the auth reverse proxy
 */
export class AuthProxyCache implements DurableObject {

    state: DurableObjectState;
    env: Env;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
    }

    /**
     * Route requests to the appropriate service based on the URL path
     */
    async routeRequest(request: Request): Promise<Response> {

        const primaryPath = this.getPrimaryPath(request);

        if (request.method === "POST") {
            return this.routePostRequest(request);
        }

        // Handle GET and all other requests
        switch (primaryPath) {

            // The data api (fp-data-api)
            case "data-api":
                return this.withAuth(request, this.env.FP_DATA_API);

            // Handle when the user wants to log out
            case "logout":
                return logout(this.env, request);

            // The dashboard (fp-dashboard)
            default:
                return this.fetchDefault(request);
        }
    }

    /**
     * Handle non matching requests
     */
    async fetchDefault(request: Request): Promise<Response> {
        let origin = fetchExternalResource({
            devUrl: this.env.FP_DASHBOARD_DEV_URL,
            prodUrl: this.env.FP_DASHBOARD_PROD_URL
        });
        return origin.fetch(request);

        // return new Response("Not Found", { status: 404 });
    }

    /**
     * Handle POST requests
     */
    async routePostRequest(request: Request): Promise<Response> {
        const primaryPath = this.getPrimaryPath(request);

        switch (primaryPath) {

            // The data api (fp-data-api)
            case "data-api":
                return this.withAuth(request, this.env.FP_DATA_API);

            // Handle when the user wants to log in
            case "login":
                return login(this.env, request);

            // Handle when the user wants to sign up
            case "signup":
                return signup(this.env, request);

            // Handle onboarding form submissions for trainers
            case "onboarding-trainer":
                // calling the withauth route to ensure the user is authenticated
                return this.withAuth(request, {
                    fetch: async (request: Request) => {
                        return handleTrainerOnboarding(this.env, request);
                    }
                });

            // Handle onboarding form submissions for clients
            case "onboarding-client":
                return handleClientOnboarding(this.env, request);

            // The dashboard (fp-dashboard)
            default:
                return this.fetchDefault(request);
        }
    }

    /**
     * Authenticate the request with Supabase
     */
    async withAuth(request: Request, origin: { fetch: (request: Request) => Promise<Response> }) {
        const { supabase, cookies } = await createClient(request);
        const { data, error } = await supabase.auth.getUser();

        const primaryPath = this.getPrimaryPath(request);

        // If the user is not authenticated, redirect to the login
        if (error || !data?.user) {
            // Ensure they're not already on the login or signup page
            if (primaryPath !== 'login' && primaryPath !== 'signup' && primaryPath !== 'logout') {
                console.log(error);
                return new Response("Unauthorized", { status: 401 });
            }
        }

        // Add the user id to the request headers
        const modifiedRequest = new Request(request);
        modifiedRequest.headers.append("X-User-Id", data?.user?.id || "");

        // Get the response from the origin
        const response: Response = await origin.fetch(modifiedRequest);

        // Return the response with the authenticated headers
        return createResponseWithCookies(response, cookies);

    }

    /**
     * Get the primary path from the request URL
     */
    getPrimaryPath(request: Request) {
        const url = new URL(request.url);
        return url.pathname.split('/')[1];
    }

    /**
     * Handle new connections
     */
    async fetch(request: Request): Promise<Response> {
        // Reverse proxy the request
        const response: Response = await this.routeRequest(request);
        return response;
    }

}

export default {
    /**
     * This is the standard fetch handler for a Cloudflare Worker
     *
     * @param request - The request submitted to the Worker from the client
     * @param env - The interface to reference bindings declared in wrangler.toml
     * @param ctx - The execution context of the Worker
     * @returns The response to be sent back to the client
     */
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

        let ip = request.headers.get("CF-Connecting-IP");

        // We will create a `DurableObjectId` using the pathname from the Worker request
        // This id refers to a unique instance of our 'MyDurableObject' class above
        let id: DurableObjectId = env.AUTH_PROXY_CACHE.idFromName(ip || 'default');

        // This stub creates a communication channel with the Durable Object instance
        // The Durable Object constructor will be invoked upon the first call for a given id
        let stub: DurableObjectStub = env.AUTH_PROXY_CACHE.get(id);

        // We call `fetch()` on the stub to send a request to the Durable Object instance
        // The Durable Object instance will invoke its fetch handler to handle the request
        return await stub.fetch(request);
    },

}