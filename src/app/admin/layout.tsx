"use client";

import { AdminShell } from "../../components/layouts";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
