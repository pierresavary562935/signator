"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { SigningRequest, Document } from "@prisma/client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCcw, FileSignature, FilePen } from "lucide-react";
import { fetchUserSigningRequests } from "@/lib/actions/user/signing-requests-actions";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "../PageHeader";

// Extended types
type SigningRequestWithDocument = SigningRequest & {
    document: Document;
};

export default function SigningRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<SigningRequestWithDocument[]>([]);
    const [signedRequests, setSignedRequests] = useState<SigningRequestWithDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSigningRequests();
    }, []);

    const fetchSigningRequests = async () => {
        setLoading(true);
        try {
            const allRequests = await fetchUserSigningRequests();
            const pending = allRequests.filter(req => req.status === "PENDING");
            const signed = allRequests.filter(req => req.status === "SIGNED");

            setRequests(pending as SigningRequestWithDocument[]);
            setSignedRequests(signed as SigningRequestWithDocument[]);
        } catch (error) {
            console.error("Error fetching signing requests:", error);
            toast.error("Failed to fetch signing requests");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
            case "SIGNED":
                return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Signed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const navigateToSigningRequest = (requestId: string) => {
        router.push(`/signing-request/${requestId}?from=signing-requests`);
    };

    // Loading skeleton for cards
    const renderSkeletons = () => {
        return Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-4">
                <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-20 rounded-md" />
                </CardFooter>
            </Card>
        ));
    };

    const renderRequestCards = (requestsList: SigningRequestWithDocument[]) => {
        if (loading) {
            return renderSkeletons();
        }

        if (requestsList.length === 0) {
            return (
                <div className="col-span-full text-center py-12">
                    <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No documents found</h3>
                    <p className="text-muted-foreground">
                        {requestsList === requests
                            ? "You don't have any pending documents to sign"
                            : "You haven't signed any documents yet"}
                    </p>
                </div>
            );
        }

        return requestsList.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-lg line-clamp-1">{req.document.title}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {req.document.filename}
                            </CardDescription>
                        </div>
                        {getStatusBadge(req.status)}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-start text-sm gap-2">
                        <span className="text-muted-foreground">Requested:</span>
                        <span>{formatDate(req.createdAt, "relative")}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button
                        onClick={() => navigateToSigningRequest(req.id)}
                        variant={req.status === "PENDING" ? "default" : "outline"}
                        size="sm"
                    >
                        {req.status === "PENDING" ? (
                            <>
                                <FileSignature className="h-4 w-4 mr-2" />
                                Review & Sign
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                View Document
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        ));
    };

    return (
        <>
            <PageHeader title="Signing Requests" icon={<FilePen size={32} />} >
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSigningRequests}
                    disabled={loading}
                    className="mt-4 sm:mt-0"
                >
                    {loading ? <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </PageHeader>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderRequestCards(requests)}
            </div>

        </>
    );
}