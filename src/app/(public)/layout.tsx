import { auth } from "../../../auth";
import { PublicShell } from "../../components/layouts";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return <PublicShell session={session}>{children}</PublicShell>;
}
