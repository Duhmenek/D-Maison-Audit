import { NextResponse } from 'next/server';
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

    // Dynamic import to avoid build-time ESM issues with pdf-parse
    const pdfModule = (await import('pdf-parse')) as any;
    const pdf = pdfModule.default || pdfModule;

    const buffer = Buffer.from(await file.arrayBuffer());

    const filename = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) { }

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const data = await pdf(buffer);
    const transactions = BankStatementParser.parse(data.text);
    const totalRevenue = BankStatementParser.extractTotalRevenue(data.text);

    return NextResponse.json({
      success: true,
      message: `Extracted ${transactions.length} transactions from statement.`,
      archivePath: `/uploads/${filename}`,
      summary: {
        totalRevenue: totalRevenue || "Not found in statement",
        transactions: transactions.slice(0, 10),
      },
    });

  } catch (error: any) {
    console.error("PDF Processing Error:", error);
    return NextResponse.json({ error: "Failed to process PDF: " + error.message }, { status: 500 });
  }
}
