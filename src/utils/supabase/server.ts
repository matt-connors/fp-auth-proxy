import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieOptions } from '@supabase/ssr'
// import { parse } from "cookie";

const projectUrl = 'https://sbxlvhfdqxsbiorecqmy.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieGx2aGZkcXhzYmlvcmVjcW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA5NzMyNjYsImV4cCI6MjAzNjU0OTI2Nn0.KOgW2Jr95_sHz6ZGKhtqFv357w2ydpXgcqaGavxJS84';

export async function createClient(request: Request) {
    let headers = new Headers();
    let supabase = createServerClient(
        projectUrl,
        anonKey,
        {
            auth: {
                autoRefreshToken: true,
            },
            cookies: {
                getAll() {
                    console.log('getting cookies');
                    return parseCookieHeader(request.headers.get("Cookie") ?? '')
                },
                setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        headers.append('Set-Cookie', serializeCookieHeader(name, value, options))
                    })
                }
            },
            // cookieEncoding: 'base64url',
        }
    );

    // await supabase.auth.getUser();

    return { supabase, headers };
}