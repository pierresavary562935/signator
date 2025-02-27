import Sidebar from "@/app-components/Sidebar";
import UserMenu from "@/app-components/UserMenu";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session) return redirect("/auth/login");
  console.log(session);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">👋 Welcome {session?.user?.name}</h2>
          <UserMenu session={session} />
        </div>

        {/* New Signing Request */}
        <div className="mt-6">
          <Button className="px-6 py-3 text-lg">New signing request</Button>
          <p className="text-sm text-gray-500 mt-2">
            *this will generate the documents you need to sign
          </p>
        </div>

        {/* My Requests Section */}
        <h3 className="mt-10 text-xl font-semibold">My requests</h3>
        {/* Add request list here later */}
      </main>
    </div>
  );
}