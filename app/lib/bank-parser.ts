export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  balance?: number;
}

export class BankStatementParser {
  /**
   * Common Regex Patterns for Bank Statements
   * 
   * Pattern 1 (Standard Tabular): 03/05/2026  ONLINE TRANSFER TO 123  5,000.00  25,000.00
   * Regex: (\d{2}/\d{2}/\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})
   */
  private static readonly TRANSACTION_REGEX = /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})?/g;

  static parse(rawText: string): ExtractedTransaction[] {
    const transactions: ExtractedTransaction[] = [];
    let match;

    // Reset regex index for global search
    this.TRANSACTION_REGEX.lastIndex = 0;

    while ((match = this.TRANSACTION_REGEX.exec(rawText)) !== null) {
      const [_, date, desc, amountStr, balanceStr] = match;

      // Clean the amount string (remove commas)
      const amount = parseFloat(amountStr.replace(/,/g, ''));
      const balance = balanceStr ? parseFloat(balanceStr.replace(/,/g, '')) : undefined;

      // Basic logic: If amount is positive, it might be credit/debit 
      // depending on bank column position. 
      // For this "Hello World", we'll assume it's a CREDIT if it adds to balance.
      transactions.push({
        date,
        description: desc.trim(),
        amount: Math.abs(amount),
        type: amount < 0 ? 'DEBIT' : 'CREDIT',
        balance
      });
    }

    return transactions;
  }

  /**
   * Specialized Regex for "Total Revenue" summary lines
   * Example: "TOTAL CREDITS: PHP 150,000.00"
   */
  static extractTotalRevenue(rawText: string): number | null {
    const revenueRegex = /TOTAL\s+CREDITS[:\s]+PHP\s+([\d,]+\.\d{2})/i;
    const match = rawText.match(revenueRegex);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }
}
