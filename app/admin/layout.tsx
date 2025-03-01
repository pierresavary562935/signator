import Sidebar from "@/app-components/Sidebar";
import "../globals.css";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1 flex flex-col p-6">{children}</main>
    </>
  );
}