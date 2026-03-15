import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  matric_number: string;
  department: string | null;
}

interface StudentAuth {
  student: Student | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (data: SignupData) => Promise<{ error?: string }>;
  logout: () => void;
}

interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  matric_number: string;
  department?: string;
  gender?: string;
  date_of_birth?: string;
  password: string;
}

// ─── Matric format: 2 digits + 2 uppercase letters + 9 digits = 13 chars
const MATRIC_REGEX = /^\d{2}[A-Z]{2}\d{9}$/;

const STORAGE_KEY = "essa_student_session";

export function useStudentAuth(): StudentAuth {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.student) setStudent(parsed.student);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke("student-auth", {
      body: { action: "login", email, password },
    });

    if (error || data?.error) {
      return { error: data?.error || "Login failed" };
    }

    setStudent(data.student);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return {};
  }, []);

  const signup = useCallback(async (signupData: SignupData) => {
    const matric = signupData.matric_number.trim().toUpperCase();

    // ── Step 1: Client-side format check (defence in depth) ──────────────────
    if (!MATRIC_REGEX.test(matric)) {
      return { error: "Invalid matriculation number format" };
    }

    // ── Step 2: Whitelist check via Supabase ──────────────────────────────────
    // The student_whitelist table is readable only via service role (edge function),
    // but we can do a lightweight check here. If the table has RLS for anon reads,
    // the check happens server-side in student-auth edge function instead.
    // We pass it through and let the edge function be the authoritative gate.

    // ── Step 3: Call edge function (server is the final authority) ────────────
    const { data, error } = await supabase.functions.invoke("student-auth", {
      body: {
        action: "signup",
        ...signupData,
        matric_number: matric, // always pass normalized uppercase
      },
    });

    if (error || data?.error) {
      return { error: data?.error || "Registration failed" };
    }

    setStudent(data.student);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return {};
  }, []);

  const logout = useCallback(() => {
    setStudent(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { student, loading, login, signup, logout };
}
