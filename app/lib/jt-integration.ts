export interface JTVerificationResult {
  isValid: boolean;
  jtTrackingNumber: string | null;
  courierStatus: 'PICKED_UP' | 'IN_TRANSIT' | 'NOT_YET_PICKED_UP';
  lastUpdate: string;
}

export class JTExpressService {
  // Mock J&T Database mapping your Invoices to their Tracking Numbers
  private static readonly JT_DATABASE: Record<string, string> = {
    '157856': '920001234567',
    '156946': '920001234568',
    '158231': '920001234569',
    '159402': '920001234570',
    '155118': '920001234571',
  };

  static async verifyInvoice(invoice: string): Promise<JTVerificationResult> {
    // In a real scenario, this would be: 
    // const res = await fetch(`https://api.jtexpress.ph/track?id=${invoice}`);
    
    const jtTrack = this.JT_DATABASE[invoice];

    if (jtTrack) {
      return {
        isValid: true,
        jtTrackingNumber: jtTrack,
        courierStatus: invoice === '155118' ? 'PICKED_UP' : 'NOT_YET_PICKED_UP',
        lastUpdate: new Date().toLocaleString(),
      };
    }

    return {
      isValid: false,
      jtTrackingNumber: null,
      courierStatus: 'NOT_YET_PICKED_UP',
      lastUpdate: new Date().toLocaleString(),
    };
  }
}
