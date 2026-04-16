import { supabase } from "@/integrations/supabase/client";

export async function listCases() {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCaseById(id: string) {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCase(payload: any) {
  const { data, error } = await supabase
    .from("cases")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCase(id: string, payload: any) {
  const { data, error } = await supabase
    .from("cases")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAuditLogs(caseId: string) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
