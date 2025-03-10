import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requiredCurrentUser } from "@/lib/current-user";
import { prisma } from "@/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await requiredCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { requestId, docId, userName, signature } = await req.json();

    // Fetch the original document from the database
    const originalDocument = await prisma.document.findUnique({
      where: { id: docId },
      include: { fieldPositions: true },
    });
    if (!originalDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check if the user has access to the document
    const signingRequest = await prisma.signingRequest.findFirst({
      where: {
        id: requestId,
        documentId: originalDocument.id,
        userId: user.id,
      },
    });

    if (!signingRequest) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      );
    }

    // Secure file path
    const sanitizedFileName = path.basename(originalDocument.filePath);
    const documentsDirectory = path.join(process.cwd(), "private/documents");

    const filePath = path.join(documentsDirectory, sanitizedFileName);

    // check if the filepath is in the documents directory
    if (!filePath.startsWith(documentsDirectory)) {
      console.error("Security violation: Attempted path traversal", {
        originalPath: originalDocument.filePath,
        sanitizedPath: filePath,
      });
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Load existing PDF
    try {
      const existingPdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Get original PDF page dimensions
      const firstPage = pdfDoc.getPages()[0];
      const { width: originalPdfWidth, height: originalPdfHeight } =
        firstPage.getSize();

      const firstField = originalDocument.fieldPositions[0];
      const previewPdfWidth = firstField?.pdfWidth || originalPdfWidth;
      const previewPdfHeight = firstField?.pdfHeight || originalPdfHeight;

      // Calculate scale factor between original PDF dimensions and the preview dimensions
      const scaleX = originalPdfWidth / previewPdfWidth;
      const scaleY = originalPdfHeight / previewPdfHeight;

      console.log("Original PDF size:", originalPdfWidth, originalPdfHeight);
      console.log("Preview PDF size:", previewPdfWidth, previewPdfHeight);
      console.log("Scale factors:", scaleX, scaleY);

      // Group positions by page
      const positionsByPage = originalDocument.fieldPositions.reduce(
        (acc, field) => {
          acc[field.pageNumber] = acc[field.pageNumber] || [];
          acc[field.pageNumber].push(field);
          return acc;
        },
        {} as Record<number, typeof originalDocument.fieldPositions>
      );

      for (const [pageNumber, fields] of Object.entries(positionsByPage)) {
        const pageIndex = Number(pageNumber) - 1;
        const page = pdfDoc.getPages()[pageIndex];

        if (page) {
          for (const field of fields) {
            let text = "";
            if (field.fieldName === "name") text = `${userName}`;
            if (field.fieldName === "signedAt")
              text = `Signed at: ${new Date().toLocaleString()}`;
            if (field.fieldName === "signature") text = `${signature}`;

            // Scale and flip Y-coordinates
            const adjustedX = field.x * scaleX;
            const adjustedY = originalPdfHeight - field.y * scaleY;

            page.drawText(text, {
              x: adjustedX,
              y: adjustedY,
              size: 12,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      // Save the signed PDF with a new filename
      const signedFileName = `signed_${Date.now()}_${sanitizedFileName}`;
      const signedFilePath = path.join(documentsDirectory, signedFileName);

      try {
        const newPdfBytes = await pdfDoc.save();
        fs.writeFileSync(signedFilePath, newPdfBytes);
      } catch (fileError) {
        console.error("Error writing signed file:", fileError);
        return NextResponse.json(
          { error: "Failed to save signed document" },
          { status: 500 }
        );
      }

      // Create a new document record in the database for the signed version
      const signedDocument = await prisma.document.create({
        data: {
          title: `${originalDocument.title} (Signed)`,
          filename: `signed_${originalDocument.filename}`,
          filePath: signedFileName, // Store only the filename
          ownerId: user.id,
          status: "SIGNED",
        },
      });

      return NextResponse.json({
        message: "Signed document created successfully",
        pdfUrl: `/api/document/${signedDocument.id}`,
        signedDocumentId: signedDocument.id,
      });
    } catch (error) {
      console.error("Error generating signed PDF:", error);
      return NextResponse.json(
        { error: "Failed to generate signed PDF" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate signed PDF" },
      { status: 500 }
    );
  }
}
