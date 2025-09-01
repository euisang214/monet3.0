import "../../styles/global.css";
import type { Metadata } from "next";
import { StatusProvider } from "../components/StatusPopup";

export const metadata: Metadata = {
  title: "Monet",
  description: "Connect candidates with professionals for structured 30-minute calls.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StatusProvider>{children}</StatusProvider>
      </body>
    </html>
  );
}
