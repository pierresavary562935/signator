"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Move, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios, { AxiosResponse } from "axios";
import { toast } from "sonner";

const PreparePDF = () => {
    const router = useRouter();
    const { id } = useParams();
    const pdfRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [pdfSize, setPdfSize] = useState({ width: 595, height: 842 });
    const [dataLoading, setDataLoading] = useState(true);
    const [selectedPage, setSelectedPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragField, setDragField] = useState<string | null>(null);
    const [positions, setPositions] = useState<Record<number, Record<string, { x: number; y: number }>>>({});

    // Available fields with labels
    const availableFields = [
        { id: "name", label: "Full Name" },
        { id: "signedAt", label: "Date Signed" },
        { id: "signature", label: "Signature" }
    ];

    // Fetch document metadata and existing positions
    useEffect(() => {
        const fetchDocumentData = async () => {
            setDataLoading(true);
            try {
                // Fetch document metadata including total pages
                const metadataResponse: AxiosResponse = await axios.get(`/api/admin/document/${id}/metadata`);
                if (!metadataResponse.data) {
                    throw new Error("Failed to fetch document metadata");
                }

                const metadata = metadataResponse.data;
                if (metadata.totalPage) {
                    setTotalPages(metadata.totalPage);
                }

                // Fetch existing field positions
                if (metadata.positions) {
                    const positionsData = await metadata.positions;

                    // Format positions data to match our state structure
                    const formattedPositions: Record<number, Record<string, { x: number; y: number }>> = {};

                    // Initialize all pages with empty positions
                    for (let i = 1; i <= metadata.totalPages; i++) {
                        formattedPositions[i] = {};
                    }

                    // Add existing positions
                    positionsData.forEach((position: {
                        pageNumber: number;
                        fieldName: string;
                        x: number;
                        y: number;
                    }) => {
                        if (!formattedPositions[position.pageNumber]) {
                            formattedPositions[position.pageNumber] = {};
                        }

                        formattedPositions[position.pageNumber][position.fieldName] = {
                            x: position.x,
                            y: position.y
                        };
                    });

                    setPositions(formattedPositions);
                }
            } catch (error) {
                console.error("Error fetching document data:", error);
            } finally {
                setDataLoading(false);
            }
        };

        if (id) {
            fetchDocumentData();
        }
    }, [id]);

    // Update PDF dimensions on load
    useEffect(() => {
        const updatePdfSize = () => {
            if (pdfRef.current) {
                const rect = pdfRef.current.getBoundingClientRect();
                setPdfSize({
                    width: rect.width - 16,
                    height: rect.height - 16
                });
            }
        };

        if (iframeRef.current) {
            iframeRef.current.onload = updatePdfSize;
        }

        window.addEventListener('resize', updatePdfSize);
        return () => window.removeEventListener('resize', updatePdfSize);
    }, [selectedPage]);

    // Ensure positions exist for the selected page
    useEffect(() => {
        if (!positions[selectedPage]) {
            setPositions((prev) => ({
                ...prev,
                [selectedPage]: {},
            }));
        }
    }, [selectedPage, positions]);

    // Handle PDF Click to set field position
    const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectedField || !pdfRef.current) return;

        const rect = pdfRef.current.getBoundingClientRect();
        const newX = Math.max(0, Math.min(e.clientX - rect.left, pdfSize.width - 100));
        const newY = Math.max(0, Math.min(e.clientY - rect.top, pdfSize.height - 40));

        setPositions((prev) => ({
            ...prev,
            [selectedPage]: {
                ...prev[selectedPage],
                [selectedField]: { x: newX, y: newY }
            }
        }));

        setSelectedField(null);
    };

    // Mouse events for dragging fields
    const handleMouseDown = (e: React.MouseEvent, field: string) => {
        e.stopPropagation();
        setIsDragging(true);
        setDragField(field);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragField || !pdfRef.current) return;

        const rect = pdfRef.current.getBoundingClientRect();
        const newX = Math.max(0, Math.min(e.clientX - rect.left, pdfSize.width - 100));
        const newY = Math.max(0, Math.min(e.clientY - rect.top, pdfSize.height - 40));

        setPositions((prev) => ({
            ...prev,
            [selectedPage]: {
                ...prev[selectedPage],
                [dragField]: { x: newX, y: newY }
            }
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragField(null);
    };

    // Save positions to backend
    const savePositions = async () => {
        try {
            const response = await fetch(`/api/admin/document/${id}/fields`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // pass positions and pdf size to the backend
                body: JSON.stringify({ positions, pdfWidth: pdfRef.current?.offsetWidth, pdfHeight: pdfRef.current?.offsetHeight })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to save positions");
            }

            const result = await response.json();
            toast.success(`Positions saved successfully! (${result.count} fields)`);
        } catch (error) {
            console.error("Error saving positions:", error);
            toast.error(`Error: ${error instanceof Error ? error.message : "Failed to save positions"}`);
        }
    };

    // Set document ready for signing
    const handleDocumentReady = async () => {
        try {
            const response = await axios.patch(`/api/admin/document/${id}`);
            if (!response.data) {
                throw new Error("Failed to set document ready");
            }

            toast.success("Document is now ready for signing!");
        } catch (error) {
            console.error("Error setting document ready:", error);
            toast.error(`Error: ${error instanceof Error ? error.message : "Failed to set document ready"}`);
        }
    };

    if (dataLoading) {
        return (
            <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading document data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Prepare Document</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left sidebar */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Field Positioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Page Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="page-select">Document Page</Label>
                            <Select
                                value={selectedPage.toString()}
                                onValueChange={(value) => setSelectedPage(Number(value))}
                            >
                                <SelectTrigger id="page-select" className="w-full">
                                    <SelectValue placeholder="Select Page" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                                            Page {i + 1}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Field Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="field-select">Add Field</Label>
                            <div className="flex flex-col gap-2">
                                {availableFields.map((field) => (
                                    <Button
                                        key={field.id}
                                        variant={selectedField === field.id ? "default" : "outline"}
                                        className="justify-start"
                                        onClick={() => setSelectedField(field.id)}
                                    >
                                        {field.label}
                                    </Button>
                                ))}
                            </div>

                            {selectedField && (
                                <Alert className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Click on the document to place the {availableFields.find(f => f.id === selectedField)?.label} field
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Field Positions */}
                        {positions[selectedPage] && Object.keys(positions[selectedPage]).length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium">Field Positions</h3>
                                <div className="space-y-3">
                                    {Object.entries(positions[selectedPage]).map(([field, pos]) => {
                                        const fieldInfo = availableFields.find(f => f.id === field);
                                        return (
                                            <div key={field} className="space-y-1">
                                                <Label className="font-medium">{fieldInfo?.label || field}</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label htmlFor={`${field}-x`} className="text-xs">X Position</Label>
                                                        <Input
                                                            id={`${field}-x`}
                                                            type="number"
                                                            value={Math.round(pos.x)}
                                                            onChange={(e) => setPositions(prev => ({
                                                                ...prev,
                                                                [selectedPage]: {
                                                                    ...prev[selectedPage],
                                                                    [field]: { ...pos, x: parseInt(e.target.value) || 0 }
                                                                }
                                                            }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`${field}-y`} className="text-xs">Y Position</Label>
                                                        <Input
                                                            id={`${field}-y`}
                                                            type="number"
                                                            value={Math.round(pos.y)}
                                                            onChange={(e) => setPositions(prev => ({
                                                                ...prev,
                                                                [selectedPage]: {
                                                                    ...prev[selectedPage],
                                                                    [field]: { ...pos, y: parseInt(e.target.value) || 0 }
                                                                }
                                                            }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button onClick={savePositions} className="w-full">
                            Save Field Positions
                        </Button>

                        {/* set document ready for signing */}
                        <Button
                            variant="outline"
                            onClick={() => handleDocumentReady()}
                            className="w-full"
                        >
                            Set Document Ready for Signing
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => router.push(`/admin/documents`)}
                            className="w-full"
                        >
                            Back to Documents
                        </Button>
                    </CardFooter>
                </Card>

                {/* PDF Preview */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Document Preview - Page {selectedPage}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            ref={pdfRef}
                            className="relative border border-gray-200 rounded-lg min-h-[800px] overflow-visible"
                            onClick={handlePdfClick}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ userSelect: "none" }}

                        >
                            {dataLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                    <p>Loading document...</p>
                                </div>
                            )}

                            <iframe
                                ref={iframeRef}
                                src={`/api/admin/document/${id}?page=${selectedPage}`}
                                className="w-full pointer-events-none"
                                style={{
                                    height: "1200px",
                                    display: "block",
                                    border: "none"
                                }}
                            />

                            {/* Positioned Fields */}
                            {positions[selectedPage] && Object.entries(positions[selectedPage]).map(([field, pos]) => {
                                const fieldInfo = availableFields.find(f => f.id === field);
                                return (
                                    <div
                                        key={field}
                                        className={`absolute p-3 rounded-md cursor-move flex items-center gap-2 border-2 ${isDragging && dragField === field ? 'bg-blue-100 border-blue-500' : 'bg-white/90 border-blue-400'}`}
                                        style={{
                                            left: `${pos.x}px`,
                                            top: `${pos.y}px`,
                                            minWidth: "100px"
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, field)}
                                    >
                                        <Move className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">{fieldInfo?.label || field}</span>
                                    </div>
                                );
                            })}

                            {selectedField && (
                                <div
                                    className="absolute pointer-events-none border-2 border-dashed border-blue-400 p-3 bg-blue-50/80 rounded-md"
                                    style={{
                                        left: "50%",
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        minWidth: "100px"
                                    }}
                                >
                                    <span className="text-sm font-medium">
                                        {availableFields.find(f => f.id === selectedField)?.label}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PreparePDF;