import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Hash password with salt
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

// Simple session token generation
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

    if (action === "signup") {
      const { first_name, last_name, email, matric_number, department, gender, date_of_birth, password } = payload;

      // Validate required fields
      if (!first_name || !last_name || !email || !matric_number || !password) {
        return new Response(JSON.stringify({ error: "All required fields must be provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 255) {
        return new Response(JSON.stringify({ error: "Invalid email address" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (password.length < 6 || password.length > 128) {
        return new Response(JSON.stringify({ error: "Password must be 6-128 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check existing email
      const { data: existingEmail } = await supabase
        .from("students").select("id").eq("email", email.toLowerCase().trim()).single();
      if (existingEmail) {
        return new Response(JSON.stringify({ error: "Email already registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check existing matric
      const { data: existingMatric } = await supabase
        .from("students").select("id").eq("matric_number", matric_number.trim()).single();
      if (existingMatric) {
        return new Response(JSON.stringify({ error: "Matriculation number already registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const password_hash = await hashPassword(password);

      const { data: student, error } = await supabase.from("students").insert({
        first_name: first_name.trim().slice(0, 100),
        last_name: last_name.trim().slice(0, 100),
        email: email.toLowerCase().trim(),
        matric_number: matric_number.trim().slice(0, 50),
        department: department?.trim().slice(0, 100) || null,
        gender: gender?.trim().slice(0, 20) || null,
        date_of_birth: date_of_birth || null,
        password_hash,
      }).select("id, first_name, last_name, email, matric_number, department").single();

      if (error) {
        console.error("Signup error:", error);
        return new Response(JSON.stringify({ error: "Registration failed. Please try again." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = generateToken();

      return new Response(JSON.stringify({ student, token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "login") {
      const { email, password } = payload;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: student, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, email, matric_number, department, password_hash")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (!student) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const valid = await verifyPassword(password, student.password_hash);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = generateToken();
      const { password_hash: _, ...safeStudent } = student;

      return new Response(JSON.stringify({ student: safeStudent, token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
