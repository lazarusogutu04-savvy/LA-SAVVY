"use client";
import { createContext, useContext } from "react";
import type { AdminSession } from "@/lib/types";

export const AdminContext = createContext<AdminSession | null>(null);

export function useAdmin(): AdminSession {
  const s = useContext(AdminContext);
  if (!s) throw new Error("useAdmin must be used inside the admin portal");
  return s;
}
