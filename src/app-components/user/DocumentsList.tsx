"use client";

import { useState, useEffect } from "react";
import { fetchUserSigningRequests } from "@/lib/actions/user/signing-requests-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileSignature, RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/date-utils";
import { useRouter } from "next/navigation";
import { getStatusBadge } from "@/lib/badge-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SigningRequestWithDocument } from "@/lib/interfaces";

export default function DocumentsList() {
    const router = useRouter();
    const [signingRequests, setSigningRequests] = useState<SigningRequestWithDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserSigningRequests()
            .then((requests) => {
                setSigningRequests(requests as SigningRequestWithDocument[]);
                setIsLoading(false);
            });
    }, []);

    // Group documents by status
    const pendingRequests = signingRequests.filter(req => req.status === "PENDING");
    const signedRequests = signingRequests.filter(req => req.status === "SIGNED");

    // Filter by search term
    const filteredRequests = signingRequests.filter(req =>
        req.document.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const navigateToSigningRequest = (requestId: string) => {
        router.push(`/signing-request/${requestId}?from=documents`);
    };

    const renderDocumentTable = (signingRequests: SigningRequestWithDocument[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Creation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <RefreshCcw className="animate-spin h-6 w-6 mx-auto" />
                        </TableCell>
                    </TableRow>
                )}
                {!isLoading && signingRequests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            No documents found
                        </TableCell>
                    </TableRow>
                ) : (
                    signingRequests.map((req) => (
                        <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.document.title}</TableCell>
                            <TableCell>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p>{formatDate(req.signedAt, "relative")}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{formatDate(req.signedAt, 'short')} {formatDate(req.signedAt, 'time')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    onClick={() => navigateToSigningRequest(req.id)}
                                    variant={req.status === "PENDING" ? "default" : "outline"}
                                    size={req.status === "PENDING" ? "sm" : "icon"}
                                    className="mr-2"
                                >
                                    {req.status === "PENDING" ? (
                                        <>
                                            <FileSignature className="h-4 w-4" />
                                            Review & Sign
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                {/* Secure Download Document Button */}
                                <Button asChild variant={"outline"} size="icon">
                                    <a href={`/api/document/${req.document.id}`} download>
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                    placeholder="Search documents..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card>
                <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All ({signingRequests.length})</TabsTrigger>
                            <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                            <TabsTrigger value="signed">Signed ({signedRequests.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all">
                            {renderDocumentTable(filteredRequests)}
                        </TabsContent>
                        <TabsContent value="pending">
                            {renderDocumentTable(pendingRequests.filter(req =>
                                req.document.title.toLowerCase().includes(searchTerm.toLowerCase())
                            ))}
                        </TabsContent>
                        <TabsContent value="signed">
                            {renderDocumentTable(signedRequests.filter(req =>
                                req.document.title.toLowerCase().includes(searchTerm.toLowerCase())
                            ))}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    );
}