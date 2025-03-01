"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchUsers, updateUserRole } from "@/lib/actions/admin/users-actions";
import { User } from "@prisma/client";

export default function AdminUserPanel() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        const usersData = await fetchUsers();
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Admin User Panel</h2>

            {loading ? (
                <p>Loading users...</p>
            ) : (
                <ul className="space-y-3">
                    {users.map((user) => (
                        <li key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">Role: {user.role}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => updateUserRole(user.id, "ADMIN")}
                                    disabled={user.role === "ADMIN"}
                                >
                                    Make Admin
                                </Button>
                                <Button
                                    onClick={() => updateUserRole(user.id, "USER")}
                                    disabled={user.role === "USER"}
                                    variant="destructive"
                                >
                                    Revoke Admin
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}