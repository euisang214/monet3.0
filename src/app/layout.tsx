import "../../styles/global.css";
import type { Metadata } from "next";

import { headers } from "next/headers";
import { auth } from "../../auth";
import {
  PublicShell,
  CandidateShell,
  ProfessionalShell,
  AdminShell,
} from "../components/layouts";


export const metadata: Metadata = {
  title: "Monet",
  description: "Connect candidates with professionals for structured 30-minute calls.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const path = headers().get("next-url") || "";

  const Shell = path.startsWith("/candidate")
    ? CandidateShell
    : path.startsWith("/professional")
    ? ProfessionalShell
    : path.startsWith("/admin")
    ? AdminShell
    : PublicShell;

  return (
    <html lang="en">
      <body>
        <Shell session={session}>{children}</Shell>
      </body>
    </html>
  );
}
