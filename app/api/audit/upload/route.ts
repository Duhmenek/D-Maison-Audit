import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { BankStatementParser } from '@/app/lib/bank-parser';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 2. Archive the PDF file (Ensuring the directory exists)
    const filename = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) { /* directory might exist */ }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 3. Extract Text & Parse with Regex
    const data = await pdf(buffer);
    const transactions = BankStatementParser.parse(data.text);
    const totalRevenue = BankStatementParser.extractTotalRevenue(data.text);

    return NextResponse.json({
      success: true,
      message: `Extracted ${transactions.length} transactions from statement.`,
      archivePath: `/uploads/${filename}`,
      summary: {
        totalRevenue: totalRevenue || "Not found in statement",
        transactions: transactions.slice(0, 10), // Return first 10 for preview
      },
    });

  } catch (error: any) {
    console.error("PDF Processing Error:", error);
    return NextResponse.json({ error: "Failed to process PDF: " + error.message }, { status: 500 });
  }
}
