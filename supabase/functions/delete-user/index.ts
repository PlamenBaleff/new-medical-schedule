// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function safeDeleteByEmail(
  supabase: ReturnType<typeof createClient>,
  table: string,
  email: string
) {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("email", email);

  if (error) {
    if (error.code === "42P01") {
      return { table, skipped: true, reason: "missing_table" };
    }
    throw error;
  }

  return { table, deleted: count ?? 0 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let payload: { email?: string } | null = null;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON payload" }, 400);
  }

  const email = String(payload?.email || "").trim().toLowerCase();
  if (!email) {
    return jsonResponse({ ok: false, error: "Email is required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey =
    Deno.env.get("SERVICE_ROLE_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Missing Supabase environment variables" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminRow, error: adminError } = await adminClient
    .from("admins")
    .select("email, is_active")
    .eq("email", userData.user.email)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    return jsonResponse({ ok: false, error: "Admin check failed" }, 500);
  }

  if (!adminRow) {
    return jsonResponse({ ok: false, error: "Forbidden" }, 403);
  }

  const tableResults = [] as Array<Record<string, unknown>>;

  try {
    tableResults.push(await safeDeleteByEmail(adminClient, "doctors", email));
    tableResults.push(await safeDeleteByEmail(adminClient, "patients", email));
    tableResults.push(await safeDeleteByEmail(adminClient, "admins", email));
    tableResults.push(await safeDeleteByEmail(adminClient, "admin_requests", email));
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Delete failed",
        tableResults
      },
      500
    );
  }

  let authDeleted = false;
  let authUserId: string | null = null;

  try {
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const match = data.users.find((u) => (u.email || "").toLowerCase() === email);
      if (match) {
        authUserId = match.id;
        break;
      }

      if (data.users.length < perPage) {
        break;
      }

      page += 1;
    }

    if (authUserId) {
      const { error } = await adminClient.auth.admin.deleteUser(authUserId);
      if (error) throw error;
      authDeleted = true;
    }
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Auth delete failed",
        tableResults,
        authDeleted
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    email,
    authDeleted,
    authUserId,
    tableResults
  });
});
