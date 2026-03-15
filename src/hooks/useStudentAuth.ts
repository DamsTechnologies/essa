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
    const { data, error } = await supabase.functions.invoke("student-auth", {
      body: { action: "signup", ...signupData },
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
