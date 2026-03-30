import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function useRealtimeTable<T>(table: string, query = "") {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const fetch = () =>
    supabase
      .from(table)
      .select(query || "*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setData((data as any) || []);
        setLoading(false);
      });
  useEffect(() => {
    fetch();
    const sub = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, fetch)
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [table]);
  return { data, loading };
}
