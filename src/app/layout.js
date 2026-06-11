import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: "AutoUnite Admin",
  description: "AutoUnite Admin Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
