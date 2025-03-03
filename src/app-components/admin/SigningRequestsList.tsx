"use client";

import axios from "axios";
import { useEffect, useState } from "react";
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { ChevronDown, ChevronRight, Download, ExternalLink, Eye, File, List, PenTool, RefreshCcw, Trash, Users, UserX } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getStatusBadge } from "@/lib/badge-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NewSigningRequestDialog from "./NewSigningRequestDialog";
import { SigningRequestWithDocument } from "@/lib/interfaces";
import PageHeader from "../PageHeader";

export function SigningRequestsList() {
    const [selectedRequest, setSelectedRequest] = useState<SigningRequestWithDocument | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grouped">("list");
    const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [signingRequests, setSigningRequests] = useState<SigningRequestWithDocument[]>([]);

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
    }, {} as Record<string, { user: any, requests: SigningRequestWithDocument[] }>);

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


    return (
        <>
            <PageHeader title="Signing Requests">
                <div className="flex items-center gap-4">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value: any) => value && setViewMode(value as "list" | "grouped")}>
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
                        onClick={fetchSigningRequests}
                        disabled={loading}
                    >
                        {loading ? <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Refresh
                    </Button>
                    <NewSigningRequestDialog onCreate={fetchSigningRequests} />
                </div>
            </PageHeader>

            {loading ? (
                <div className="flex justify-center p-6">
                    <RefreshCcw className="h-6 w-6 animate-spin" />
                </div>
            ) : signingRequests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    No pending signing requests found.
                </div>
            ) : viewMode === "list" ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Document</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Signed</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {signingRequests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.document.filename}</TableCell>
                                <TableCell>
                                    {req.user?.email ?
                                        <p>{req.user?.email}</p>
                                        : req.email ?
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <UserX className="h-4 w-4" /> {req.email}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>This user is not registered in the system.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            : <p>Unknown</p>
                                    }
                                </TableCell>
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
                                        <AvatarImage src={user.image} />
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


            {/* Signing Request Details Dialog */}

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Signing Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6">
                            {/* Document Preview */}
                            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border">
                                <div className="p-3 bg-primary/10 rounded-md">
                                    <File className="h-10 w-10 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium">{selectedRequest.document.filename}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedRequest.document.status} • {formatDate(selectedRequest.document.createdAt, 'short')} {formatDate(selectedRequest.document.createdAt, 'time')}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleViewDocument(selectedRequest.documentId)}>
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadDocument(selectedRequest.documentId)}>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Request Details */}
                            <div>
                                <h2 className="text-lg font-medium mb-4">Request Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Recipient</h4>
                                        <p className="font-medium">{selectedRequest.user?.email || selectedRequest.email || "—"}</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                            <p>{getStatusBadge(selectedRequest.status)}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                                            <p>{formatDate(selectedRequest.createdAt, 'short')} {formatDate(selectedRequest.createdAt, 'time')}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Signed</h4>
                                            <p>{formatDate(selectedRequest.signedAt, 'dateTime') || "Not signed"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Request ID</h4>
                                            <p className="font-mono text-xs">{selectedRequest.id}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground">Document ID</h4>
                                            <p className="font-mono text-xs">{selectedRequest.documentId}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                {selectedRequest.status === "PENDING" && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="default" size="sm">
                                                <PenTool className="h-4 w-4 mr-1" />
                                                Force sign
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will mark the document as signed without the recipient's signature. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => {
                                                        handleForceSign(selectedRequest.id);
                                                        setDetailsOpen(false);
                                                    }}
                                                    className="bg-red-500 hover:bg-red-600"
                                                >
                                                    Force Sign
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete the signing request for <span className="font-medium">{selectedRequest.user?.email || selectedRequest.email || "this document"}</span> and remove all associated data. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => {
                                                    handleDelete(selectedRequest.id);
                                                    setDetailsOpen(false);
                                                }}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export default SigningRequestsList;