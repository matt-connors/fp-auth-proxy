import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { parse } from "cookie";

export function createClient(request: Request) {

    let headers: HeadersInit = {};
    let supabase = createServerClient(
        "https://sbxlvhfdqxsbiorecqmy.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNieGx2aGZkcXhzYmlvcmVjcW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA5NzMyNjYsImV4cCI6MjAzNjU0OTI2Nn0.KOgW2Jr95_sHz6ZGKhtqFv357w2ydpXgcqaGavxJS84",
        {
            cookies: {
                getAll() {
                    let cookies = parse(request.headers.get("Cookie") || "");
                    return Object
                        .entries(cookies)
                        .map(([name, value]) => ({ name, value }))
                },
                setAll(cookies) {
                    headers["Set-Cookie"] = cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ");
                }
            }
        }
    );

    return { supabase, headers };
}