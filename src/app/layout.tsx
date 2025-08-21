import "../../styles/global.css";
import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "../../auth";

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
  return (
    <html lang="en">
      <body>
        <header style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}>
          <div className="container row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ gap: 12 }}>
              <img src="/brand/monet-wordmark.svg" alt="Monet" height={32} />
              <nav className="nav">
                <Link href="/#about">About Us</Link>
                <Link href="/#how">How It Works</Link>
                <Link href="/#contact">Contact</Link>
              </nav>
            </div>
            <div className="row" style={{ gap: 8 }}>
              {session?.user ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut();
                  }}
                >
                  <button className="btn btn-danger">Sign Out</button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="btn">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

