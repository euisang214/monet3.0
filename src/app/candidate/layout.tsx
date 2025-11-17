import { CandidateShell } from "@/components/ui/layouts";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return <CandidateShell>{children}</CandidateShell>;
}
