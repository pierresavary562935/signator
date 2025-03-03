"use client";

import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, CheckCircle, FileText, RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/date-utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { toast } from "sonner";
import { SigningRequestWithDocument } from "@/lib/interfaces";

interface DocumentPreviewComponentProps {
    selectedRequest: SigningRequestWithDocument | undefined;
    onSignSuccess: () => void;
    documentId: string | undefined;
    requestId: string | undefined;
}

export default function DocumentPreviewComponent({ selectedRequest, onSignSuccess, documentId, requestId }: DocumentPreviewComponentProps) {
    const router = useRouter();
    const searchParams = useSearchParams()

    const [agreed, setAgreed] = useState<boolean>(false);
    const [signing, setSigning] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [openAgreement, setOpenAgreement] = useState(false);
    const [documentLoaded, setDocumentLoaded] = useState(false);
    const [from, setFrom] = useState("documents");

    const handleFrameLoaded = () => {
        const iframe = document.querySelector("iframe");
        if (iframe && iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
            setDocumentLoaded(true);
        }
    };

    useEffect(() => {
        // get from from url 
        const from = searchParams.get('from')
        if (from) {
            setFrom(from)
        }

        if (documentId) {
            fetchSummary();
        }
    }, [documentId]);

    const fetchSummary = async () => {
        setLoadingSummary(true);
        try {
            const { data } = await axios.post("/api/document/summary", { documentId });
            setSummary(data.summary);
        } catch (error) {
            console.error("Error fetching summary:", error);
            toast.error("Failed to generate document summary.");
        } finally {
            setLoadingSummary(false);
        }
    };

    const handleSignDocument = async () => {
        setSigning(true);
        try {
            const response = await axios.patch(`/api/signing-request/${requestId}`);
            if (response.data.createdAt) {
                toast.success("Document signed successfully on " + formatDate(response.data.createdAt));
                setOpenAgreement(false);
                onSignSuccess();
            }
        } catch (error) {
            console.error("Error signing document:", error);
            toast.error("Failed to sign document.");
        } finally {
            setSigning(false);
        }
    };
    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => from === "documents" ? router.push("/documents") : router.push("/home")}
                        className="mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{selectedRequest?.document.title}</h1>
                        <p className="text-muted-foreground">
                            {formatDate(selectedRequest?.createdAt)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 sm:mt-0">
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: selectedRequest?.status === "PENDING" ? "#FEF9C3" : "#DCFCE7",
                            color: selectedRequest?.status === "PENDING" ? "#854D0E" : "#166534",
                            borderColor: selectedRequest?.status === "PENDING" ? "#FEF08A" : "#BBF7D0"
                        }}
                    >
                        {selectedRequest?.status}
                    </span>
                </div>
            </div>

            <Separator className="mb-4" />

            {/* Content Tabs */}
            <Tabs defaultValue="document" className="w-full h-full">
                <TabsList className="grid w-full grid-cols-2 mb-2" >
                    <TabsTrigger value="document" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Document
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="flex items-center" onClick={() => setDocumentLoaded(false)}>
                        <Bot className="h-4 w-4 mr-2" />
                        AI Summary
                    </TabsTrigger>
                </TabsList>

                {/* Document Content Tab */}
                <TabsContent value="document" className="w-full">
                    <Card className="h-full">
                        <CardContent className="h-full">
                            {selectedRequest?.document ? (
                                <div className="h-full">
                                    {!documentLoaded &&
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-muted-foreground">Loading document...</p>
                                        </div>
                                    }
                                    <div className={`h-full ${documentLoaded ? "" : "hidden"}`}>
                                        <iframe
                                            src={`/api/document/${selectedRequest.document.id}`}
                                            className="w-full min-h-full rounded-md border"
                                            title="Document Preview"
                                            onLoad={() => handleFrameLoaded()}
                                        />
                                    </div>

                                </div>
                            ) : selectedRequest?.document.id ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <p className="text-muted-foreground mb-2">Unable to display document content.</p>

                                    <Button asChild variant="outline" className="mr-2">
                                        <a href={`/api/document/${selectedRequest.document.id}`} target="_blank" rel="noopener noreferrer">
                                            Open Original
                                        </a>
                                    </Button>
                                </div>

                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-muted-foreground">Loading document...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Summary Tab */}
                <TabsContent value="summary">
                    <Card>
                        <CardContent>
                            <div className="mb-3 flex items-center">
                                <h3 className="text-lg font-semibold">AI-Generated Summary</h3>
                                {loadingSummary && (
                                    <RefreshCcw className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            <ScrollArea className="h-[50vh] w-full rounded-md border p-4 bg-muted/50">
                                {loadingSummary ? (
                                    <p className="text-muted-foreground">Generating summary...</p>
                                ) : (
                                    <div className="prose max-w-none">
                                        <ul className="list-disc list-inside">
                                            {selectedRequest?.document.summary && selectedRequest.document.summary.split("\n").map((line, i) => {
                                                // Convert **bold** markdown to <strong> HTML
                                                const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

                                                return line.startsWith("-") ? (
                                                    <li key={i} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
                                                ) : (
                                                    <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} className="mb-2" />
                                                );
                                            })}
                                        </ul>
                                    </div>

                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Agreement and Actions */}
            <div className="mt-4">
                {selectedRequest && selectedRequest?.status === "PENDING" ? (
                    <>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                            <Button
                                onClick={() => setOpenAgreement(true)}
                                className="order-1 sm:order-2"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Sign Document
                            </Button>
                        </div>
                    </>
                ) : selectedRequest?.status === "SIGNED" && (
                    <Card>
                        <CardContent>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-4">

                                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                                    <div className="flex flex-col">

                                        <h3 className="text-xl font-semibold">Document Signed</h3>
                                        <p className="text-muted-foreground">
                                            This document has been successfully signed {formatDate(selectedRequest?.signedAt)} at {formatDate(selectedRequest?.signedAt, "time")}
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={() => router.push("/home")}>
                                    Back to {from === "documents" ? "Documents" : "Home"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={openAgreement} onOpenChange={() => setOpenAgreement(false)}>
                    <DialogContent>
                        <DialogTitle hidden>Sign Document Dialog</DialogTitle>
                        <div className="flex items-start space-x-3">
                            <Checkbox
                                id="agreement"
                                checked={agreed}
                                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                            />
                            <div>
                                <Label
                                    htmlFor="agreement"
                                    className="font-medium"
                                >
                                    I have read and agree to the terms of this document
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    By checking this box, I confirm that I have reviewed the document and agree to sign electronically.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setOpenAgreement(false)}
                                className="order-2 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSignDocument}
                                disabled={!agreed || signing}
                                className="order-1 sm:order-2"
                            >
                                {signing ? (
                                    <>
                                        <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Sign Document
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>



            </div>
        </>
    );
}
