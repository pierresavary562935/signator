import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Toaster />
        <div className="flex h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}