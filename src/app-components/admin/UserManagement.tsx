"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Search, Pencil, Key, UserX, CheckCircle2 } from "lucide-react";
import axios, { AxiosResponse } from "axios";
import { Document, SigningRequest, User } from "@prisma/client";
import { formatDate } from "@/lib/date-utils";
import { updateUserRole } from "@/lib/actions/admin/users-actions";

interface ExtendedUser extends User {
    documents: Document[];
    signingRequests: SigningRequest[];
}

export default function UserManagement() {
    const [users, setUsers] = useState<ExtendedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

    // user fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"USER" | "ADMIN">("USER");

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response: AxiosResponse = await axios.get('/api/admin/users');
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast.error("Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filter users based on search term
    const filteredUsers = users.filter(
        (user) =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewUserDetails = (user: ExtendedUser) => {
        setSelectedUser(user);
        setIsUserDetailsOpen(true);
    };

    const handleEditUser = (user: ExtendedUser) => {
        setSelectedUser(user);
        setIsEditUserOpen(true);
    };

    const handleResetPassword = (user: ExtendedUser) => {
        setSelectedUser(user);
        setIsResetPasswordOpen(true);
    };

    const handleSaveUserEdit = async () => {
        if (!selectedUser) {
            return;
        }
        try {
            const response = await axios.put(`/api/admin/users/${selectedUser.id}`, {
                name: name || selectedUser.name,
                email: email || selectedUser.email,
                role: role || selectedUser.role,
            });
            const updatedUsers: ExtendedUser[] = users.map((user) => {
                if (user.id === selectedUser.id) {
                    return response.data;
                }
                return user;

            }
            );
            setUsers(updatedUsers);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
        } finally {
            toast.success("User updated successfully");
            setIsEditUserOpen(false);
        }
    };

    const handlePasswordReset = () => {
        // Mock implementation
        toast.success("Password reset email sent");
        setIsResetPasswordOpen(false);
    };

    const handleUpdateRole = async (id: string, newRole: "USER" | "ADMIN") => {
        try {
            await updateUserRole(id, newRole);
            const updatedUsers = users.map((user) => {
                if (user.id === id) {
                    return { ...user, role: newRole };
                }
                return user;
            });
            setUsers(updatedUsers);
        } catch (error) {
            console.error("Error updating user role:", error);
            toast.error("Failed to update role.");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    return (
        <div className="space-y-4">
            {/* Search and add user */}
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            {/* Users table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Signing Requests</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>{getInitials(user.name || "")}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={user.role === "ADMIN" ? "default" : "outline"}
                                        >
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell>{user.documents.length}</TableCell>
                                    <TableCell>{user.signingRequests.length}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => handleViewUserDetails(user)}
                                                >
                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                {user.role === "ADMIN" ? (
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "USER")}>
                                                        <UserX className="mr-2 h-4 w-4" />
                                                        Revoke Admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleUpdateRole(user.id, "ADMIN")}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Make Admin
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* User Details Dialog */}
            <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={selectedUser.image || undefined} />
                                    <AvatarFallback>{getInitials(selectedUser.name || "")}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedUser.email}
                                    </p>
                                    <Badge
                                        variant={selectedUser.role === "ADMIN" ? "default" : "outline"}
                                        className="mt-1"
                                    >
                                        {selectedUser.role}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium">Joined</div>
                                    <div>{formatDate(selectedUser.createdAt)}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">User ID</div>
                                    <div className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
                                        {selectedUser.id}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-medium">Documents</div>
                                    <div>{selectedUser.documents.length} documents</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium">Signing Requests</div>
                                    <div>{selectedUser.signingRequests.length} requests</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
                            Close
                        </Button>
                        {selectedUser && (
                            <Button onClick={() => {
                                setIsUserDetailsOpen(false);
                                handleEditUser(selectedUser);
                            }}>
                                Edit User
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input defaultValue={selectedUser.name || ""} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input defaultValue={selectedUser.email || ""} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select defaultValue={selectedUser.role} onValueChange={(value) => setRole(value as "USER" | "ADMIN")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveUserEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Send a password reset link to the user&apos;s email.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <p>
                                Are you sure you want to send a password reset link to{" "}
                                <strong>{selectedUser.email}</strong>?
                            </p>
                            <p className="text-sm text-muted-foreground">
                                The user will receive an email with instructions to reset their
                                password.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handlePasswordReset}>Send Reset Link</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 