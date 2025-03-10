"use client";

import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Eye, FileSignature, List, Loader2, RefreshCcw, Search, Trash, Users } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NewSigningRequestDialog from "./NewSigningRequestDialog";
import { SigningRequestWithDocument } from "@/lib/interfaces";
import { User } from "@prisma/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowUp,
    ArrowDown,
    Info,
    MoreHorizontal,
    Check,
} from "lucide-react";
import {
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getStatusBadge } from "@/lib/badge-utils";
import { AlertDialogHeader, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@radix-ui/react-alert-dialog";

export function SigningRequestsList() {
    const [selectedRequest, setSelectedRequest] = useState<SigningRequestWithDocument | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
    const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [signingRequests, setSigningRequests] = useState<SigningRequestWithDocument[]>([]);

    // New state for enhanced features
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState<string>("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchSigningRequests = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/signing-request');
            if (response.status !== 200) {
                toast.error('Failed to fetch signing requests');
                return;
            }
            setSigningRequests(response.data || []);
        }
        catch (error) {
            console.error(error);
            toast.error('Failed to fetch signing requests');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSigningRequests();
    }, []);

    const refreshData = async () => {
        setIsRefreshing(true);
        await fetchSigningRequests();
        setIsRefreshing(false);
    };

    const openDetailsDialog = (request: SigningRequestWithDocument) => {
        setSelectedRequest(request);
        setDetailsOpen(true);
    };

    const toggleUserExpanded = (userId: string) => {
        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    // Group signing requests by user
    const groupedRequests = signingRequests.reduce((groups, request) => {
        const userKey = request.userId || request.email || 'unknown';
        if (!groups[userKey]) {
            groups[userKey] = {
                user: request.user || { id: userKey, email: request.email || 'No email', name: 'External User' },
                requests: []
            };
        }
        groups[userKey].requests.push(request);
        return groups;
    }, {} as Record<string, { user: User, requests: SigningRequestWithDocument[] }>);

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/admin/signing-request/${id}`);
            toast.success("Signing request deleted successfully.");
            fetchSigningRequests();
        } catch (error) {
            console.error("Error deleting signing request:", error);
            toast.error("Failed to delete signing request.");
        }
    }

    const handleForceSign = async (id: string) => {
        try {
            await axios.patch(`/api/admin/signing-request/${id}`);
            toast.success("Document signed successfully.");
            fetchSigningRequests();
        } catch (error) {
            console.error("Error signing document:", error);
            toast.error("Failed to sign document.");
        }
    }

    const handleViewDocument = (id: string) => {
        // <a href={`/api/document/${doc.id}`} target="_blank" rel="noopener noreferrer">
        window.open(`/api/document/${id}`, '_blank');
    };

    const handleDownloadDocument = (id: string) => {
        // <a href={`/api/document/${doc.id}`} download>

        // force download
        const link = document.createElement('a');
        link.href = `/api/document/${id}`;
        link.download = 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // New filtering and sorting logic
    const filteredRequests = useMemo(() => {
        return signingRequests.filter(request => {
            // Apply status filter
            if (statusFilter !== "all" && request.status.toLowerCase() !== statusFilter.toLowerCase()) {
                return false;
            }

            // Apply search term
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (request.user?.name?.toLowerCase() || "").includes(searchLower) ||
                (request.user?.email?.toLowerCase() || "").includes(searchLower) ||
                (request.email?.toLowerCase() || "").includes(searchLower) ||
                request.document.title.toLowerCase().includes(searchLower);

            return matchesSearch;
        });
    }, [signingRequests, statusFilter, searchTerm]);

    // Sort the filtered requests
    const sortedRequests = useMemo(() => {
        return [...filteredRequests].sort((a, b) => {
            let aValue: any = a[sortField as keyof typeof a];
            let bValue: any = b[sortField as keyof typeof b];

            // Handle nested fields
            if (sortField === "user.name") {
                aValue = a.user?.name || "";
                bValue = b.user?.name || "";
            } else if (sortField === "document.title") {
                aValue = a.document?.title || "";
                bValue = b.document?.title || "";
            }

            // Handle dates
            if (sortField === "createdAt" || sortField === "signedAt") {
                aValue = aValue ? new Date(aValue).getTime() : 0;
                bValue = bValue ? new Date(bValue).getTime() : 0;
            }

            // Compare values
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredRequests, sortField, sortDirection]);

    // Paginate the sorted requests
    const paginatedRequests = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return sortedRequests.slice(startIndex, startIndex + pageSize);
    }, [sortedRequests, page, pageSize]);

    // Calculate total pages
    const totalPages = Math.ceil(sortedRequests.length / pageSize);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex flex-row items-center gap-2">
                        <FileSignature className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>Signing Requests</CardTitle>
                            <CardDescription>
                                View and manage all signing requests across the platform
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "list" | "grouped")}>
                            <ToggleGroupItem value="list" aria-label="List view">
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem value="grouped" aria-label="Grouped by user">
                                <Users className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshData}
                            disabled={isRefreshing}
                        >
                            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <NewSigningRequestDialog onCreate={fetchSigningRequests} />
                    </div>
                </CardHeader>
                <CardContent>

                    {viewMode === "list" ? (
                        <>
                            {/* Filters and search */}
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search requests..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full md:w-40">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="signed">Signed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Data table */}
                            <div className="rounded-md border mt-2">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    if (sortField === "user.name") {
                                                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                                    } else {
                                                        setSortField("user.name");
                                                        setSortDirection("asc");
                                                    }
                                                }}
                                            >
                                                Requester
                                                {sortField === "user.name" && (
                                                    sortDirection === "asc" ?
                                                        <ArrowUp className="inline ml-1 h-4 w-4" /> :
                                                        <ArrowDown className="inline ml-1 h-4 w-4" />
                                                )}
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    if (sortField === "document.title") {
                                                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                                    } else {
                                                        setSortField("document.title");
                                                        setSortDirection("asc");
                                                    }
                                                }}
                                            >
                                                Document
                                                {sortField === "document.title" && (
                                                    sortDirection === "asc" ?
                                                        <ArrowUp className="inline ml-1 h-4 w-4" /> :
                                                        <ArrowDown className="inline ml-1 h-4 w-4" />
                                                )}
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    if (sortField === "status") {
                                                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                                    } else {
                                                        setSortField("status");
                                                        setSortDirection("asc");
                                                    }
                                                }}
                                            >
                                                Status
                                                {sortField === "status" && (
                                                    sortDirection === "asc" ?
                                                        <ArrowUp className="inline ml-1 h-4 w-4" /> :
                                                        <ArrowDown className="inline ml-1 h-4 w-4" />
                                                )}
                                            </TableHead>
                                            <TableHead
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    if (sortField === "createdAt") {
                                                        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
                                                    } else {
                                                        setSortField("createdAt");
                                                        setSortDirection("desc");
                                                    }
                                                }}
                                            >
                                                Created
                                                {sortField === "createdAt" && (
                                                    sortDirection === "asc" ?
                                                        <ArrowUp className="inline ml-1 h-4 w-4" /> :
                                                        <ArrowDown className="inline ml-1 h-4 w-4" />
                                                )}
                                            </TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedRequests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    No signing requests found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedRequests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={request.user?.image || undefined} />
                                                                <AvatarFallback>{getInitials(request.user?.name ?? "")}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{request.user?.name || "External User"}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {request.user?.email || request.email || "No email"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{request.document.title}</div>
                                                        <div className="text-sm text-muted-foreground">{request.document.filename}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={request.status.toLowerCase() === "signed" ? "success" : "outline"}
                                                            className={request.status.toLowerCase() === "signed" ? "bg-green-100 text-green-800" : ""}
                                                        >
                                                            {request.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span>{formatDate(request.createdAt, "relative")}</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{formatDate(request.createdAt, "medium")}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openDetailsDialog(request)}>
                                                                    <Info className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleViewDocument(request.document.id)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Document
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDownloadDocument(request.document.id)}>
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Download
                                                                </DropdownMenuItem>
                                                                {request.status.toLowerCase() === "pending" && (
                                                                    <DropdownMenuItem onClick={() => handleForceSign(request.id)}>
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                        Force Sign
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => handleDelete(request.id)}
                                                                >
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {!loading && sortedRequests.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sortedRequests.length)} of {sortedRequests.length} results
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="sr-only">Previous Page</span>
                                        </Button>
                                        <div className="text-sm">
                                            Page {page} of {totalPages}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages || totalPages === 0}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            <span className="sr-only">Next Page</span>
                                        </Button>
                                        <Select
                                            value={pageSize.toString()}
                                            onValueChange={(value) => {
                                                setPageSize(Number(value));
                                                setPage(1); // Reset to first page when changing page size
                                            }}
                                        >
                                            <SelectTrigger className="w-20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="10">10</SelectItem>
                                                <SelectItem value="25">25</SelectItem>
                                                <SelectItem value="50">50</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            {Object.values(groupedRequests).map(({ user, requests }) => (
                                <Collapsible
                                    key={user.id}
                                    open={expandedUsers[user.id]}
                                    onOpenChange={() => toggleUserExpanded(user.id)}
                                    className="border rounded-md"
                                >
                                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                {user.image &&
                                                    <AvatarImage src={user.image} />
                                                }
                                                <AvatarFallback>{user.name ? getInitials(user.name) : user.email?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start">
                                                <h3 className="font-medium">{user.name || 'External User'}</h3>
                                                <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">

                                            {requests.filter(r => r.status === "PENDING").length === 0 ?
                                                <Badge variant="default" className="bg-green-100 text-green-800">All signed</Badge>
                                                :
                                                <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                                                    {requests.filter(r => r.status === "PENDING").length} pending
                                                </Badge>
                                            }
                                            <Badge>
                                                {requests.length} document{requests.length !== 1 ? 's' : ''}
                                            </Badge>
                                            {expandedUsers[user.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="px-4 pb-4">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Document</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Created</TableHead>
                                                        <TableHead>Signed</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {requests.map((req) => (
                                                        <TableRow key={req.id}>
                                                            <TableCell className="font-medium">{req.document.filename}</TableCell>
                                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                                            <TableCell> {formatDate(req.createdAt, 'short')} {formatDate(req.createdAt, 'time')}</TableCell>
                                                            <TableCell>{formatDate(req.signedAt, 'short')} {formatDate(req.signedAt, 'time')}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => openDetailsDialog(req)}
                                                                        className={req.status === "PENDING" ? "mr-2" : ""}
                                                                    >
                                                                        <Eye />
                                                                    </Button>
                                                                    {req.status === "PENDING" && (
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="destructive" size="icon">
                                                                                    <Trash className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        This will permanently delete the signing request for <span className="font-medium">{req.email || req.user.email || 'this user'}</span> and remove all associated data. This action cannot be undone.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                    <AlertDialogAction onClick={
                                                                                        () => {
                                                                                            handleDelete(req.id);
                                                                                        }
                                                                                    } className="bg-red-500 hover:bg-red-600">
                                                                                        Delete
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    )}
                                                                </div>

                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    )}

                    {/* Details dialog */}
                    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Signing Request Details</DialogTitle>
                            </DialogHeader>

                            {selectedRequest && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Document Information</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <div className="text-sm font-medium">Title</div>
                                                    <div>{selectedRequest.document.title}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">Filename</div>
                                                    <div>{selectedRequest.document.filename}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">Created At</div>
                                                    <div>{formatDate(selectedRequest.document.createdAt, "medium")}</div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewDocument(selectedRequest.document.id)}
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Document
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDownloadDocument(selectedRequest.document.id)}
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Requester Information</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {selectedRequest.user ? (
                                                    <>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={selectedRequest.user.image || undefined} />
                                                                <AvatarFallback>{getInitials(selectedRequest.user.name || "")}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium">{selectedRequest.user.name}</div>
                                                                <div className="text-sm text-muted-foreground">{selectedRequest.user.email}</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">User ID</div>
                                                            <div className="text-sm text-muted-foreground">{selectedRequest.user.id}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div>
                                                        <div className="text-sm font-medium">Email</div>
                                                        <div>{selectedRequest.email || "Unknown"}</div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Signing Status</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium">Current Status</div>
                                                    <Badge
                                                        variant={selectedRequest.status.toLowerCase() === "signed" ? "success" : "outline"}
                                                        className={selectedRequest.status.toLowerCase() === "signed" ? "bg-green-100 text-green-800" : ""}
                                                    >
                                                        {selectedRequest.status}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium">Created At</div>
                                                    <div>{formatDate(selectedRequest.createdAt, "medium")}</div>
                                                </div>

                                                {selectedRequest.signedAt && (
                                                    <div>
                                                        <div className="text-sm font-medium">Signed At</div>
                                                        <div>{formatDate(selectedRequest.signedAt, "medium")}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedRequest.status.toLowerCase() === "pending" && (
                                                <Button onClick={() => handleForceSign(selectedRequest.id)}>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Force Sign as Admin
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </>
    );
}

export default SigningRequestsList;