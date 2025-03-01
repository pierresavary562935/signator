import { User } from "@prisma/client";
import axios from "axios";
import { toast } from "sonner";

/**
 * Fetch all users from the API
 */
export const fetchUsers = async (): Promise<User[]> => {
    try {
        const response = await axios.get<User[]>("/api/admin/users");
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users.");
        return [];
    }
};

/**
 * Update user role (promote to admin or revoke admin role)
 */
export const updateUserRole = async (id: string, newRole: "USER" | "ADMIN") => {
    try {
        await axios.patch(`/api/admin/users/${id}`, { role: newRole });
        toast.success("User role updated.");
    } catch (error) {
        console.error("Error updating user role:", error);
        toast.error("Failed to update role.");
    }
};