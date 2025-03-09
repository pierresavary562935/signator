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

    const { docId, userName, signature } = await req.json();

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
        documentId: originalDocument.id,
        userId: user.id,
      },
    });
    console.log("signingRequest", signingRequest);
    if (!signingRequest) {
      return NextResponse.json(
        { error: "You don't have access to this document" },
        { status: 403 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "private/documents",
      originalDocument.filePath
    );
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Load existing PDF
    const existingPdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get original PDF page dimensions
    const firstPage = pdfDoc.getPages()[0]; // Assume first page for size reference
    const { width: originalPdfWidth, height: originalPdfHeight } =
      firstPage.getSize();
    const { pdfWidth, pdfHeight } = originalDocument.fieldPositions.reduce(
      (acc, field) => {
        acc.pdfWidth = Math.max(acc.pdfWidth, field.x);
        acc.pdfHeight = Math.max(acc.pdfHeight, field.y);
        return acc;
      },
      { pdfWidth: 0, pdfHeight: 0 }
    );

    console.log("Original PDF size:", originalPdfWidth, originalPdfHeight);
    console.log("Rendered PDF size:", pdfWidth, pdfHeight);

    // Calculate scale factor between original PDF and displayed PDF
    const scaleX = originalPdfWidth / pdfWidth;
    const scaleY = originalPdfHeight / pdfHeight;

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
          if (field.fieldName === "name") text = `Signed by: ${userName}`;
          if (field.fieldName === "signedAt")
            text = `Signed at: ${new Date().toLocaleString()}`;
          if (field.fieldName === "signature") text = `Signature: ${signature}`;

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
    const signedFileName = `${
      path.parse(originalDocument.filePath).name
    }_signed.pdf`;
    const signedFilePath = path.join(
      process.cwd(),
      "private/documents",
      signedFileName
    );
    const newPdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedFilePath, newPdfBytes);

    // Create a new document record in the database for the signed version
    const signedDocument = await prisma.document.create({
      data: {
        title: `${originalDocument.title} (Signed)`,
        filename: signedFileName,
        filePath: signedFileName,
        ownerId: user.id, // Set the signed document's owner
        status: "SIGNED",
        // originalDocumentId: originalDocument.id, // Link to the original document
      },
    });

    return NextResponse.json({
      message: "Signed document created successfully",
      pdfUrl: `/api/document/${signedDocument.id}`, // API endpoint to fetch the new file
      signedDocumentId: signedDocument.id,
    });
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate signed PDF" },
      { status: 500 }
    );
  }
}
