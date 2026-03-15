import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Matric format: 2 digits + 2 uppercase letters + 9 digits = 13 chars
// e.g. 24EF021030058
const MATRIC_REGEX = /^\d{2}[A-Z]{2}\d{9}$/;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const saltedData = encoder.encode(saltHex + password);
  const saltedHash = await crypto.subtle.digest("SHA-256", saltedData);
  const hashHex = Array.from(new Uint8Array(saltedHash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHash] = stored.split(":");
  if (!saltHex || !storedHash) return false;
  const encoder = new TextEncoder();
  const saltedData = encoder.encode(saltHex + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", saltedData);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === storedHash;
}

function generateToken(): string {
  const arr = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...payload } = await req.json();

    // ══════════════════════════════════════════════════════════════════════════
    // SIGNUP
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "signup") {
      const {
        first_name, last_name, email, matric_number,
        department, gender, date_of_birth, password,
      } = payload;

      // ── 1. Required fields ────────────────────────────────────────────────
      if (!first_name || !last_name || !email || !matric_number || !password) {
        return new Response(
          JSON.stringify({ error: "All required fields must be provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 2. Email format ───────────────────────────────────────────────────
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 255) {
        return new Response(
          JSON.stringify({ error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 3. Password length ────────────────────────────────────────────────
      if (password.length < 6 || password.length > 128) {
        return new Response(
          JSON.stringify({ error: "Password must be 6-128 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 4. Matric number format check (server-side, cannot be bypassed) ──
      const cleanedMatric = matric_number.trim().toUpperCase();
      if (!MATRIC_REGEX.test(cleanedMatric)) {
        return new Response(
          JSON.stringify({
            error: "Invalid matriculation number format. Expected format: 2-digit year + 2-letter faculty code + 9 digits (e.g. 24EF021030058)",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 5. Whitelist check — is this matric number authorised? ────────────
      const { data: whitelisted, error: whitelistError } = await supabase
        .from("student_whitelist")
        .select("id")
        .eq("matric_number", cleanedMatric)
        .single();

      if (whitelistError || !whitelisted) {
        return new Response(
          JSON.stringify({
            error: "Your matriculation number is not on the ESSA student register. If you believe this is an error, please contact the ESSA admin.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 6. Duplicate email check ──────────────────────────────────────────
      const { data: existingEmail } = await supabase
        .from("students")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single();
      if (existingEmail) {
        return new Response(
          JSON.stringify({ error: "Email already registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 7. Duplicate matric check ─────────────────────────────────────────
      const { data: existingMatric } = await supabase
        .from("students")
        .select("id")
        .eq("matric_number", cleanedMatric)
        .single();
      if (existingMatric) {
        return new Response(
          JSON.stringify({ error: "Matriculation number already registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── 8. Create account ─────────────────────────────────────────────────
      const password_hash = await hashPassword(password);

      const { data: student, error } = await supabase
        .from("students")
        .insert({
          first_name: first_name.trim().slice(0, 100),
          last_name: last_name.trim().slice(0, 100),
          email: email.toLowerCase().trim(),
          matric_number: cleanedMatric,
          department: department?.trim().slice(0, 100) || null,
          gender: gender?.trim().slice(0, 20) || null,
          date_of_birth: date_of_birth || null,
          password_hash,
        })
        .select("id, first_name, last_name, email, matric_number, department")
        .single();

      if (error) {
        console.error("Signup error:", error);
        return new Response(
          JSON.stringify({ error: "Registration failed. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = generateToken();

      return new Response(
        JSON.stringify({ student, token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LOGIN
    // ══════════════════════════════════════════════════════════════════════════
    if (action === "login") {
      const { email, password } = payload;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: student } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, matric_number, department, password_hash")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (!student) {
        return new Response(
          JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const valid = await verifyPassword(password, student.password_hash);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = generateToken();
      const { password_hash: _, ...safeStudent } = student;

      return new Response(
        JSON.stringify({ student: safeStudent, token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UNKNOWN ACTION
    // ══════════════════════════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
