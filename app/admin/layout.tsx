import "../globals.css";
import { requiredCurrentUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { User } from "@prisma/client";
import AdminSidebar from "@/app-components/admin/AdminSidebar";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const user = await requiredCurrentUser() as User;

	if (!user || user.role !== "ADMIN") {
		return redirect("/");
	}

	return (
		<>
			<AdminSidebar user={user} />
			{/* Main Content */}
			<main className="flex-1 flex flex-col p-6">
				{children}
			</main >
		</>
	);
}