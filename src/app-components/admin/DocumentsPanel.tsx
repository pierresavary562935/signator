"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import NewDocumentDialog from "./NewDocumentDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Document } from "@prisma/client";
import { Bot, Download, ExternalLink, FileSignature, FileText, RefreshCcw, ScanText, Search, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PageHeader from "../PageHeader";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { getStatusBadge } from "@/lib/badge-utils";

export default function DocumentsPanel() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // AI Generation Options
    const [aiOptions, setAiOptions] = useState({
        model: "gpt-4",
        maxTokens: 300,
        customPrompt: false,
        promptText: "Summarize the following document:",
        outputType: "summary",
        bulletPoints: false,
        highlightKeyPoints: false
    });

    // Fetch documents
    const fetchDocuments = async () => {
        try {
            const response = await axios.get<Document[]>("/api/admin/document");
            setDocuments(response.data);
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast.error("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);


    const draftDocuments = documents.filter(doc => doc.status === "DRAFT");
    const readyDocuments = documents.filter(doc => doc.status === "READY");
    const signedDocuments = documents.filter(doc => doc.status === "SIGNED");
    // Filter by search term
    const filteredDocuments = documents.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Delete document
    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/admin/document/${id}`);
            toast.success("Document deleted successfully.");
            fetchDocuments(); // Refresh the list
        } catch (error) {
            console.error("Error deleting document:", error);
            toast.error("Failed to delete document.");
        }
    };

    // Regenerate AI Summary
    const handleRegenerateSummary = async (documentId: string) => {
        setSummaryLoading(true);

        try {
            const response = await fetch(`/api/admin/document/${documentId}/regenerate-summary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aiOptions)
            });

            if (!response.ok) {
                throw new Error('Failed to regenerate summary');
            }

            const data = await response.json();
            setDocuments(documents.map(doc => doc.id === documentId ? { ...doc, summary: data.summary } : doc));
            toast.success('Summary regenerated successfully');
        } catch (error) {
            console.error('Error regenerating summary:', error);
            toast.error('Failed to regenerate summary');
        } finally {
            setSummaryLoading(false);
        }
    };

    const renderDocumentTable = (documents: Document[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={5}>
                            <RefreshCcw className="animate-spin h-6 w-6 mx-auto" />
                        </TableCell>
                    </TableRow>
                )}
                {!loading && documents.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            No documents found
                        </TableCell>
                    </TableRow>
                ) : (
                    documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell>{doc.title}</TableCell>
                            <TableCell>{doc.filename}</TableCell>
                            <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell className="text-right">
                                {doc.status !== "SIGNED" && (
                                    <Dialog>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DialogTrigger asChild>
                                                        <Button size="icon" className="mr-2">
                                                            <Bot className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>AI Summary</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <DialogContent className="sm:max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    Document Summary
                                                </DialogTitle>
                                                <DialogDescription>
                                                    AI-generated summary of &quot;{doc.filename}&quot;
                                                </DialogDescription>
                                            </DialogHeader>

                                            <Tabs>
                                                <TabsList className="w-full grid grid-cols-2">
                                                    <TabsTrigger value="summary">Summary</TabsTrigger>
                                                    <TabsTrigger value="options">AI Options</TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="summary">
                                                    {summaryLoading ? (
                                                        <Card className="p-2">
                                                            <CardContent className="overflow-y-auto p-4 bg-gray-100 rounded-md flex flex-col gap-2">
                                                                <Skeleton className="h-4 w-full" />
                                                                <Skeleton className="h-4 w-[90%]" />
                                                                <Skeleton className="h-4 w-[95%]" />
                                                                <Skeleton className="h-4 w-[85%]" />
                                                            </CardContent>
                                                        </Card>
                                                    ) : (
                                                        <Card className="p-2">
                                                            <CardContent className="text-sm max-h-96 overflow-y-auto p-4 bg-gray-100 rounded-md">
                                                                {doc.summary ? (
                                                                    <div className="prose max-w-none">
                                                                        <ul className="list-disc list-inside">
                                                                            {doc.summary.split("\n").map((line, i) => {
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
                                                                ) : (
                                                                    <p className="text-gray-500">No summary is available for this document.</p>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="options" className="py-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label>AI Model</Label>
                                                        <Select
                                                            value={aiOptions.model}
                                                            onValueChange={(value) => setAiOptions({ ...aiOptions, model: value })}
                                                        >
                                                            <SelectTrigger id="model">
                                                                <SelectValue placeholder="Select model" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="gpt-4">GPT-4 (Most capable)</SelectItem>
                                                                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>


                                                    <div className="space-y-2">
                                                        <Label>Summary Length ({aiOptions.maxTokens} tokens)</Label>
                                                        <Slider
                                                            id="max-tokens"
                                                            value={[aiOptions.maxTokens]}
                                                            min={100}
                                                            max={1000}
                                                            step={50}
                                                            onValueChange={(value) => setAiOptions({ ...aiOptions, maxTokens: value[0] })}
                                                        />
                                                    </div>


                                                    <div className="space-y-2">
                                                        <Label>Output Format</Label>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    id="bullet-points"
                                                                    checked={aiOptions.bulletPoints}
                                                                    onCheckedChange={(checked) => setAiOptions({ ...aiOptions, bulletPoints: checked })}
                                                                />
                                                                <Label>Bullet Points</Label>
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    id="highlight-key-points"
                                                                    checked={aiOptions.highlightKeyPoints}
                                                                    onCheckedChange={(checked) => setAiOptions({ ...aiOptions, highlightKeyPoints: checked })}
                                                                />
                                                                <Label>Highlight Key Points</Label>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Summary Type</Label>
                                                        <Select
                                                            value={aiOptions.outputType}
                                                            onValueChange={(value) => setAiOptions({ ...aiOptions, outputType: value })}
                                                        >
                                                            <SelectTrigger id="output-type">
                                                                <SelectValue placeholder="Select output type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="summary">General Summary</SelectItem>
                                                                <SelectItem value="executive">Executive Summary</SelectItem>
                                                                <SelectItem value="technical">Technical Summary</SelectItem>
                                                                <SelectItem value="key-points">Key Points Only</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Separator />
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label>Custom Prompt</Label>
                                                            <Switch
                                                                id="custom-prompt"
                                                                checked={aiOptions.customPrompt}
                                                                onCheckedChange={(checked) => setAiOptions({ ...aiOptions, customPrompt: checked })}
                                                            />
                                                        </div>

                                                        {aiOptions.customPrompt && (
                                                            <Textarea
                                                                value={aiOptions.promptText}
                                                                onChange={(e) => setAiOptions({ ...aiOptions, promptText: e.target.value })}
                                                                placeholder="Enter custom instructions for the AI"
                                                                className="min-h-[100px]"
                                                            />
                                                        )}
                                                    </div>
                                                </TabsContent>
                                            </Tabs>

                                            <DialogFooter className="flex justify-between sm:justify-between gap-2">
                                                <DialogTrigger asChild>
                                                    <Button variant="outline">Close</Button>
                                                </DialogTrigger>
                                                <Button
                                                    onClick={() => handleRegenerateSummary(doc.id)}
                                                    disabled={summaryLoading}
                                                    variant="default"
                                                    className="gap-2"
                                                >
                                                    <RefreshCcw className={`h-4 w-4 ${summaryLoading ? 'animate-spin' : ''}`} />
                                                    Generate Summary
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {/* View Secure Document */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button asChild variant="outline" size="icon" className="mr-2">
                                                <a href={`/api/document/${doc.id}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>View</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {/* Prepare PDF Document */}
                                {doc.status !== "SIGNED" && (

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button asChild variant="outline" size="icon" className="mr-2">
                                                    <Link href="/admin/documents/prepare/[id]" as={`/admin/documents/prepare/${doc.id}`}>
                                                        <ScanText className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Prepare PDF</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {/* Secure Download Document Button */}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button asChild variant="outline" size="icon" className="mr-2">
                                                <a href={`/api/document/${doc.id}`} download>
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Download</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <AlertDialog>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon" className="mr-2">
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Delete</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete <span className="font-medium">{doc.filename || "this document"}</span> and remove all associated data. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-red-500 hover:bg-red-600">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table >
    );

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex flex-row items-center gap-2">
                        <FileSignature className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>
                                View and manage all documents across the platform
                            </CardDescription>
                        </div>
                    </div>
                    <NewDocumentDialog onUpload={fetchDocuments} />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <Input
                            placeholder="Search documents..."
                            className="max-w-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Card className="mt-4">
                        <CardContent>
                            <Tabs defaultValue="all" className="w-full">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="all">All ({filteredDocuments.length})</TabsTrigger>
                                    <TabsTrigger value="pending">Draft ({draftDocuments.length})</TabsTrigger>
                                    <TabsTrigger value="ready">Ready ({readyDocuments.length})</TabsTrigger>
                                    <TabsTrigger value="signed">Signed ({signedDocuments.length})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="all">
                                    {renderDocumentTable(filteredDocuments)}
                                </TabsContent>
                                <TabsContent value="pending">
                                    {renderDocumentTable(draftDocuments.filter(doc =>
                                        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
                                    ))}
                                </TabsContent>
                                <TabsContent value="ready">
                                    {renderDocumentTable(readyDocuments.filter(doc =>
                                        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
                                    ))}
                                </TabsContent>
                                <TabsContent value="signed">
                                    {renderDocumentTable(signedDocuments.filter(doc =>
                                        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
                                    ))}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </>
    );
}