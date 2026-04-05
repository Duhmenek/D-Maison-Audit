'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// --- FONTS (deduplicated) ---
const FONTS = [
  { name: "Great Vibes", fam: "Great Vibes" },
  { name: "Allura", fam: "Allura" },
  { name: "Scriptina", fam: "Scriptina" },
  { name: "Moyudan", fam: "Moyudan" },
  { name: "Amarillo", fam: "Amarillo" },
  { name: "Bestie Seventy", fam: "Bestie Seventy" },
  { name: "Dancing Script", fam: "Dancing Script" },
  { name: "Alex Brush", fam: "Alex Brush" },
  { name: "Pinyon Script", fam: "Pinyon Script" },
  { name: "Tangerine", fam: "Tangerine" },
  { name: "Adine Kirnberg", fam: "Adine Kirnberg" },
  { name: "Euphoria Script", fam: "Euphoria Script" },
  { name: "Imperial Script", fam: "Imperial Script" },
  { name: "Lavishly Yours", fam: "Lavishly Yours" },
  { name: "Luxurious Script", fam: "Luxurious Script" },
  { name: "Mr Dafoe", fam: "Mr Dafoe" },
  { name: "Mr De Haviland", fam: "Mr De Haviland" },
  { name: "Mrs Saint Delafield", fam: "Mrs Saint Delafield" },
  { name: "Mrs Sheppards", fam: "Mrs Sheppards" },
  { name: "Parisienne", fam: "Parisienne" },
  { name: "Passions Conflict", fam: "Passions Conflict" },
  { name: "Sacramento", fam: "Sacramento" },
  { name: "The Nautigal", fam: "The Nautigal" },
  { name: "Updock", fam: "Updock" },
  { name: "Waterfall", fam: "Waterfall" },
  { name: "Zeyada", fam: "Zeyada" },
  { name: "Berkshire Swash", fam: "Berkshire Swash" },
  { name: "Bilbo", fam: "Bilbo" },
  { name: "Bonheur Royale", fam: "Bonheur Royale" },
  { name: "Carattere", fam: "Carattere" },
  { name: "Charm", fam: "Charm" },
  { name: "Clicker Script", fam: "Clicker Script" },
  { name: "Courgette", fam: "Courgette" },
  { name: "Dawning of a New Day", fam: "Dawning of a New Day" },
  { name: "Dr Sugiyama", fam: "Dr Sugiyama" },
  { name: "Eagle Lake", fam: "Eagle Lake" },
  { name: "Felipa", fam: "Felipa" },
  { name: "Fleur De Leah", fam: "Fleur De Leah" },
  { name: "Fondamento", fam: "Fondamento" },
  { name: "Gwendolyn", fam: "Gwendolyn" },
  { name: "Herr Von Muellerhoff", fam: "Herr Von Muellerhoff" },
  { name: "Hurricane", fam: "Hurricane" },
  { name: "Italianno", fam: "Italianno" },
  { name: "Kaushan Script", fam: "Kaushan Script" },
  { name: "Licorice", fam: "Licorice" },
  { name: "Lovers Quarrel", fam: "Lovers Quarrel" },
  { name: "Meie Script", fam: "Meie Script" },
  { name: "Monsieur La Doulaise", fam: "Monsieur La Doulaise" },
  { name: "Montez", fam: "Montez" },
  { name: "Niconne", fam: "Niconne" },
  { name: "Norican", fam: "Norican" },
  { name: "Oooh Baby", fam: "Oooh Baby" },
  { name: "Over the Rainbow", fam: "Over the Rainbow" },
  { name: "Pacifico", fam: "Pacifico" },
  { name: "Princess Sofia", fam: "Princess Sofia" },
  { name: "Ruthie", fam: "Ruthie" },
  { name: "Sail", fam: "Sail" },
  { name: "Seaweed Script", fam: "Seaweed Script" },
  { name: "Send Flowers", fam: "Send Flowers" },
  { name: "Sevillana", fam: "Sevillana" },
  { name: "Shalimar", fam: "Shalimar" },
  { name: "Sofia", fam: "Sofia" },
  { name: "Stalemate", fam: "Stalemate" },
  { name: "Vibur", fam: "Vibur" },
  { name: "Yellowtail", fam: "Yellowtail" },
  { name: "Yesteryear", fam: "Yesteryear" },
  { name: "Angel Tears", fam: "Angel Tears" },
  { name: "Aquafina Script", fam: "Aquafina Script" },
  { name: "Belinda", fam: "Belinda" },
  { name: "Beloved Script", fam: "Beloved Script" },
  { name: "Blackhaven", fam: "Blackhaven" },
  { name: "Brittany Signature", fam: "Brittany Signature" },
  { name: "Brusher", fam: "Brusher" },
  { name: "Carmelina", fam: "Carmelina" },
  { name: "Cloister Black", fam: "Cloister Black" },
  { name: "Corinthia", fam: "Corinthia" },
  { name: "Dream Avenue", fam: "Dream Avenue" },
  { name: "Feel Script", fam: "Feel Script" },
  { name: "Florida Vibes", fam: "Florida Vibes" },
  { name: "Golden Plains", fam: "Golden Plains" },
  { name: "Halimun", fam: "Halimun" },
  { name: "Hummingbird", fam: "Hummingbird" },
  { name: "Inspiration", fam: "Inspiration" },
  { name: "Lavanderia", fam: "Lavanderia" },
  { name: "Lemon Tuesday", fam: "Lemon Tuesday" },
  { name: "Liana", fam: "Liana" },
  { name: "Magnolia Script", fam: "Magnolia Script" },
  { name: "Moontime", fam: "Moontime" },
  { name: "Mr Canfields", fam: "Mr Canfields" },
  { name: "Old English Text", fam: "Old English Text MT" },
  { name: "Palace Script MT", fam: "Palace Script MT" },
  { name: "Petit Formal Script", fam: "Petit Formal Script" },
  { name: "Selena", fam: "Selena" },
  { name: "Silk Script", fam: "Silk Script" },
  { name: "Simply Conception", fam: "Simply Conception" },
  { name: "Snell Roundhand", fam: "Snell Roundhand" },
  { name: "Southern Script", fam: "Southern Script" },
  { name: "Summer Hearts", fam: "Summer Hearts" },
  { name: "Sunday Morning", fam: "Sunday Morning" },
  { name: "Sweet Cheeks", fam: "Sweet Cheeks" },
  { name: "Sweetly Broken", fam: "Sweetly Broken" },
  { name: "Tropicana", fam: "Tropicana" },
  { name: "Unifraktur Cook", fam: "UnifrakturCook" },
  { name: "Vivaldi", fam: "Vivaldi" },
  { name: "Voyage", fam: "Voyage" },
  { name: "Whisper", fam: "Whisper" },
  { name: "Windsong", fam: "WindSong" },
  { name: "Wonderland", fam: "Wonderland" },
];

const FONT_SHORTCUTS: Record<string, { name: string; fam: string }> = {
  'font 1': { name: 'Great Vibes', fam: 'Great Vibes' },
  'font 2': { name: 'Allura', fam: 'Allura' },
  'font 3': { name: 'Scriptina', fam: 'Scriptina' },
  'font 4': { name: 'Moyudan', fam: 'Moyudan' },
  'font 5': { name: 'Amarillo', fam: 'Amarillo' },
  'font 6': { name: 'Bestie Seventy', fam: 'Bestie Seventy' },
  'font 7': { name: 'Dancing Script', fam: 'Dancing Script' },
};

const MAX_WIDTH_MM = 38.1;
const CALIB_REF_MM = 50;
const EXPORT_SCALE = 10; // 10px/mm = 254 DPI
const PNG_PX_PER_M = EXPORT_SCALE * 1000;

export default function PendantSizer() {
  // --- State ---
  const [pxPerMm, setPxPerMm] = useState(96 / 25.4);
  const [state, setState] = useState({
    name: "Lourdes",
    fontFam: "Great Vibes",
    fontName: "Great Vibes",
    widthMM: 50,
    heightMM: 15,
    color: "#000000",
  });
  const [batch, setBatch] = useState<any[]>([]);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [calibInput, setCalibInput] = useState("");
  const [fontSearch, setFontSearch] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [showExportOverlay, setShowExportOverlay] = useState(false);

  // Sheet State
  const [sheetSettings, setSheetSettings] = useState({
    width: 210,
    height: 297,
    gap: 6,
    bg: 'transparent',
    layout: 'row' as 'row' | 'col' | 'center',
    showLabels: true,
    showOutlines: true,
  });

  const sheetPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Helpers ---
  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  }, []);

  const ensureFont = async (fontFam: string, text: string) => {
    try {
      await (document as any).fonts.load(`48px '${fontFam}'`, text || 'Aa');
    } catch (e) {}
  };

  const calcFontSize = (text: string, fontFam: string, maxWidthPx: number, heightPx: number, ctx: CanvasRenderingContext2D, heightRatio = 0.82) => {
    const ceiling = heightPx * heightRatio;
    let lo = 1, hi = ceiling, best = 1;
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      ctx.font = `${mid}px '${fontFam}', cursive, serif`;
      if (ctx.measureText(text || 'A').width <= maxWidthPx) {
        best = mid; lo = mid;
      } else {
        hi = mid;
      }
    }
    return best;
  };

  const clampedW = Math.min(state.widthMM, MAX_WIDTH_MM);
  const wPx = clampedW * pxPerMm;
  const hPx = state.heightMM * pxPerMm;
  const maxTextW = wPx * 0.88;

  // Use a temporary canvas for font size calculations
  const [fontSize, setFontSize] = useState(20);
  const [textMm, setTextMm] = useState("0.0");

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const fs = calcFontSize(state.name, state.fontFam, maxTextW, hPx, ctx);
      setFontSize(fs);
      
      ctx.font = `${fs}px '${state.fontFam}', cursive, serif`;
      const textW = ctx.measureText(state.name || '').width;
      let textMMVal = textW / pxPerMm;
      if (textW >= maxTextW * 0.98) {
        textMMVal = clampedW;
      }
      if (textMMVal > 38.1) textMMVal = 38.1;
      setTextMm(textMMVal.toFixed(1));
    }
  }, [state, pxPerMm, clampedW, hPx, maxTextW]);

  // --- Actions ---
  const applyCalibration = () => {
    const val = parseFloat(calibInput);
    if (isNaN(val) || val < 10 || val > 200) {
      toast('Enter a valid measurement (10–200mm)');
      return;
    }
    const newPxPerMm = (CALIB_REF_MM * pxPerMm) / val;
    setPxPerMm(newPxPerMm);
    setIsCalibrated(true);
    toast(`✓ Calibrated! ${val}mm measured`);
  };

  const addToBatch = () => {
    if (!state.name.trim()) {
      toast('Enter a name first');
      return;
    }
    setBatch([...batch, { ...state }]);
    toast('Added to order list');
  };

  const removeFromBatch = (index: number) => {
    setBatch(batch.filter((_, i) => i !== index));
  };

  const copyFontName = () => {
    navigator.clipboard.writeText(state.fontName)
      .then(() => toast('Font name copied: ' + state.fontName));
  };

  // --- Export Logic ---
  const crc32 = (buf: Uint8Array) => {
    let t = (crc32 as any)._t;
    if (!t) {
      t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let v = n;
        for (let k = 0; k < 8; k++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
        t[n] = v;
      }
      (crc32 as any)._t = t;
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  const buildPHYs = (ppm: number) => {
    const data = new Uint8Array(9);
    const dv = new DataView(data.buffer);
    dv.setUint32(0, ppm, false);
    dv.setUint32(4, ppm, false);
    data[8] = 1;
    const type = new Uint8Array([0x70, 0x48, 0x59, 0x73]);
    const crcBuf = new Uint8Array(13);
    crcBuf.set(type, 0); crcBuf.set(data, 4);
    const csum = crc32(crcBuf);
    const chunk = new Uint8Array(21);
    const cv = new DataView(chunk.buffer);
    cv.setUint32(0, 9, false);
    chunk.set(type, 4); chunk.set(data, 8);
    cv.setUint32(17, csum, false);
    return chunk;
  };

  const canvasToPhysicalPNG = async (canvas: HTMLCanvasElement) => {
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error("Canvas to Blob failed");
    const orig = new Uint8Array(await blob.arrayBuffer());
    const phys = buildPHYs(PNG_PX_PER_M);
    const out = new Uint8Array(orig.length + phys.length);
    out.set(orig.slice(0, 33));
    out.set(phys, 33);
    out.set(orig.slice(33), 33 + phys.length);
    return new Blob([out], { type: 'image/png' });
  };

  const downloadPNG = async (canvas: HTMLCanvasElement, filename: string) => {
    const blob = await canvasToPhysicalPNG(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const exportItem = async (item: typeof state) => {
    const cW = Math.round(Math.min(item.widthMM, MAX_WIDTH_MM) * EXPORT_SCALE);
    const cH = Math.round(item.heightMM * EXPORT_SCALE);
    const mTW = cW * 0.88;

    await ensureFont(item.fontFam, item.name);

    const canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fs = calcFontSize(item.name, item.fontFam, mTW, cH, ctx);
    ctx.font = `${fs}px '${item.fontFam}', cursive, serif`;
    ctx.fillStyle = item.color || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.name, cW / 2, cH / 2);

    const tW = ctx.measureText(item.name).width;
    let tMM = (tW / EXPORT_SCALE).toFixed(1);
    if (parseFloat(tMM) >= 38.1) tMM = "38.1";

    await downloadPNG(canvas, `${item.name}_${tMM}x${item.heightMM}mm_254dpi.png`);
  };

  const savePNG = async () => {
    setExportMsg(`Exporting ${state.name}…`);
    setShowExportOverlay(true);
    try {
      await exportItem(state);
      toast(`✓ Saved — ${Math.min(state.widthMM, MAX_WIDTH_MM).toFixed(1)}×${state.heightMM}mm at 254 DPI`);
    } catch (err: any) {
      toast('Export error: ' + err.message);
    } finally {
      setShowExportOverlay(false);
    }
  };

  const exportAllSeparate = async () => {
    if (!batch.length) { toast('Add names to the order list first'); return; }
    setShowExportOverlay(true);
    try {
      for (let i = 0; i < batch.length; i++) {
        setExportMsg(`Exporting ${i + 1} / ${batch.length}: ${batch[i].name}…`);
        await exportItem(batch[i]);
        await new Promise(r => setTimeout(r, 250));
      }
      toast(`✓ Exported ${batch.length} PNGs at 254 DPI`);
    } catch (e: any) {
      toast('Export error: ' + e.message);
    } finally {
      setShowExportOverlay(false);
    }
  };

  // --- Sheet Logic ---
  const buildSheetCanvas = async (targetW: number | null) => {
    const sWmm = sheetSettings.width;
    const sHmm = sheetSettings.height;
    const gMM = sheetSettings.gap;
    
    const S = targetW ? targetW / (sWmm * EXPORT_SCALE) : 1;
    const rScale = EXPORT_SCALE * S;
    const cW = Math.round(sWmm * rScale);
    const cH = Math.round(sHmm * rScale);
    const gap = gMM * rScale;
    const padEdge = 8 * rScale;
    const labelH = sheetSettings.showLabels ? 11 * rScale : 0;

    const canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (sheetSettings.bg === 'transparent') {
      ctx.clearRect(0, 0, cW, cH);
    } else {
      ctx.fillStyle = sheetSettings.bg;
      ctx.fillRect(0, 0, cW, cH);
    }

    const tCanvas = document.createElement('canvas');
    const tCtx = tCanvas.getContext('2d');
    if (!tCtx) return canvas;

    let x = padEdge, y = padEdge + (10 * rScale), rowMaxH = 0;

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      await ensureFont(item.fontFam, item.name);
      
      const iW = item.widthMM * rScale;
      const iH = item.heightMM * rScale;
      const maxTW = iW * 0.88;
      const blockH = iH + labelH;

      const fs = calcFontSize(item.name, item.fontFam, maxTW, iH, tCtx);

      if (sheetSettings.layout === 'row') {
        if (x + iW > cW - padEdge && i > 0) { x = padEdge; y += rowMaxH + gap; rowMaxH = 0; }
        rowMaxH = Math.max(rowMaxH, blockH);
      } else if (sheetSettings.layout === 'col') {
        x = padEdge;
      } else {
        x = (cW - iW) / 2;
      }

      if (sheetSettings.showOutlines) {
        ctx.save();
        ctx.strokeStyle = item.color || '#d4a843';
        ctx.lineWidth = Math.max(1, rScale);
        ctx.globalAlpha = 0.4;
        ctx.strokeRect(x, y, iW, iH);
        ctx.beginPath();
        ctx.arc(x + iW / 2, y - 3 * rScale, 3 * rScale, Math.PI, 0);
        ctx.stroke();
        ctx.restore();
      }

      ctx.font = `${fs}px '${item.fontFam}', cursive, serif`;
      ctx.fillStyle = item.color || '#d4a843';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, x + iW / 2, y + iH / 2);

      if (sheetSettings.showLabels) {
        tCtx.font = `${fs}px '${item.fontFam}', cursive, serif`;
        const textW = tCtx.measureText(item.name || '').width;
        let textMMVal = textW / rScale;
        if (textW >= maxTW * 0.98) textMMVal = item.widthMM;
        if (textMMVal > 38.1) textMMVal = 38.1;
        const tMM = textMMVal.toFixed(1);

        ctx.font = `${Math.max(6, 6 * rScale)}px 'Cormorant Garamond', Georgia, serif`;
        ctx.fillStyle = 'rgba(180,170,150,0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${item.name}  ·  ${tMM}×${item.heightMM}mm  ·  ${item.fontName}`, x + iW / 2, y + iH + 2 * rScale);
      }

      if (sheetSettings.layout === 'row') x += iW + gap;
      else y += blockH + gap;
    }

    return canvas;
  };

  const previewSheet = async () => {
    if (!sheetPreviewCanvasRef.current) return;
    const pc = sheetPreviewCanvasRef.current;
    const maxW = Math.min(480, pc.parentElement?.clientWidth || 480);
    const built = await buildSheetCanvas(maxW * 2);
    pc.width = Math.min(maxW, Math.round(built.width / 2));
    pc.height = Math.round(pc.width * built.height / built.width);
    const pctx = pc.getContext('2d');
    if (pctx) {
      pctx.clearRect(0, 0, pc.width, pc.height);
      pctx.drawImage(built, 0, 0, pc.width, pc.height);
    }
  };

  useEffect(() => {
    if (isSheetModalOpen) {
      previewSheet();
    }
  }, [isSheetModalOpen, sheetSettings, batch]);

  const downloadSheet = async () => {
    if (!batch.length) { toast('No items in order list'); return; }
    setIsSheetModalOpen(false);
    setShowExportOverlay(true);
    setExportMsg('Building sheet…');
    try {
      const full = await buildSheetCanvas(null);
      await downloadPNG(full, `pendant-order-sheet_${batch.length}names_254dpi.png`);
      toast(`✓ Sheet exported — ${batch.length} pendants at 254 DPI`);
    } catch (e: any) {
      toast('Sheet error: ' + e.message);
    } finally {
      setShowExportOverlay(false);
    }
  };

  const filteredFonts = useMemo(() => {
    return fontSearch
      ? FONTS.filter(f => f.name.toLowerCase().includes(fontSearch.toLowerCase()))
      : FONTS;
  }, [fontSearch]);

  const handleNameChange = (val: string) => {
    const key = val.trim().toLowerCase();
    if (FONT_SHORTCUTS[key]) {
      setState(s => ({ ...s, fontFam: FONT_SHORTCUTS[key].fam, fontName: FONT_SHORTCUTS[key].name }));
      toast(`Font ${key.replace('font ', '')} → ${FONT_SHORTCUTS[key].name}`);
      return;
    }
    setState(s => ({ ...s, name: val }));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Pendant Name Sizer</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Custom Necklace Studio</p>
        </div>
        <div className="header-tip text-[10px] font-black tracking-widest text-slate-400 border border-slate-200 px-4 py-2 rounded-full bg-white uppercase">
          Real-size preview at 96dpi
        </div>
      </header>

      <div className="flex bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-100 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Customer Name</span>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-serif italic focus:ring-2 focus:ring-[#947a46] focus:border-transparent outline-none transition-all shadow-sm"
              type="text" 
              placeholder="e.g. Lourdes" 
              value={state.name} 
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={30} 
            />
            <div className="mt-4 bg-white/50 border border-slate-100 rounded-xl p-4 shadow-sm">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">⌨ Font Shortcuts</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {Object.entries(FONT_SHORTCUTS).map(([key, f]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[9px] font-black text-[#947a46] uppercase">{key}</span>
                    <span className="truncate italic" style={{ fontFamily: f.fam }}>{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              Pendant Width <span className="text-rose-500 font-bold ml-1">(max 38.1mm)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[30, 40, 50, 38.1].map(mm => (
                <button 
                  key={mm}
                  onClick={() => setState(s => ({ ...s, widthMM: mm }))}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                    state.widthMM === mm 
                      ? 'bg-[#947a46] text-white border-[#947a46] shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#947a46] hover:text-[#947a46]'
                  }`}
                >
                  <span className="block text-sm mb-0.5">{mm === 38.1 ? '57mm' : mm + 'mm'}</span>
                  <span className="text-[9px] opacity-70 uppercase tracking-widest">
                    {mm === 30 ? 'Delicate' : mm === 40 ? 'Petite' : mm === 50 ? 'Standard' : 'Max Limit'}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center space-x-3">
              <input 
                className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-sm focus:ring-2 focus:ring-[#947a46] outline-none"
                type="number" 
                value={state.widthMM}
                onChange={(e) => setState(s => ({ ...s, widthMM: parseFloat(e.target.value) || 0 }))}
                min="10" 
                max="38.1" 
                step="0.01" 
                placeholder="Custom"
              />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">mm wide</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Pendant Height</span>
            <div className="flex items-center space-x-3">
              <input 
                className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-sm focus:ring-2 focus:ring-[#947a46] outline-none"
                type="number" 
                value={state.heightMM}
                onChange={(e) => setState(s => ({ ...s, heightMM: parseFloat(e.target.value) || 0 }))}
                min="5" 
                max="80" 
                step="0.5" 
              />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">mm tall</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Text Color</span>
            <div className="flex flex-wrap gap-2">
              {[
                { c: "#d4a843", n: "Gold" },
                { c: "#f0c96a", n: "Light Gold" },
                { c: "#c0c0c0", n: "Silver" },
                { c: "#ffffff", n: "White" },
                { c: "#000000", n: "Black" },
                { c: "#b76e79", n: "Rose Gold" },
              ].map(color => (
                <button 
                  key={color.c}
                  onClick={() => setState(s => ({ ...s, color: color.c }))}
                  title={color.n}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    state.color === color.c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent shadow-sm'
                  }`}
                  style={{ background: color.c }}
                />
              ))}
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm hover:scale-110 transition-transform">
                <input 
                  type="color" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  value={state.color}
                  onChange={(e) => setState(s => ({ ...s, color: e.target.value }))}
                />
                <div className="w-full h-full" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }} />
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Calligraphy Font</span>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#947a46] outline-none mb-3 shadow-sm"
              type="text" 
              placeholder="Search 80+ fonts…" 
              value={fontSearch}
              onChange={(e) => setFontSearch(e.target.value)}
            />
            <div className="h-64 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {filteredFonts.map(f => (
                <button 
                  key={f.name}
                  onClick={() => setState(s => ({ ...s, fontFam: f.fam, fontName: f.name }))}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    state.fontFam === f.fam 
                      ? 'bg-[#947a4608] border-[#947a46] text-[#947a46]' 
                      : 'bg-white border-slate-100 hover:border-[#947a4650] text-slate-700'
                  }`}
                >
                  <span className="text-xl truncate" style={{ fontFamily: f.fam }}>{state.name || 'Aa'}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-50 ml-2">{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order List</span>
              <div className="flex space-x-2">
                <button 
                  onClick={exportAllSeparate}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Separate PNGs
                </button>
                <button 
                  onClick={() => setIsSheetModalOpen(true)}
                  className="px-3 py-1.5 bg-[#947a46] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Compile Sheet
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 mb-4">
              {batch.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  No items yet
                </div>
              ) : (
                batch.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm group">
                    <div className="flex flex-col min-w-0">
                      <span className="text-base truncate italic" style={{ fontFamily: item.fontFam }}>{item.name}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {item.widthMM}×{item.heightMM}mm · {item.fontName}
                      </span>
                    </div>
                    <button onClick={() => removeFromBatch(i)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={addToBatch}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-[#947a46] hover:text-[#947a46] transition-all bg-white"
            >
              + Add to Order List
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-50/50">
          {/* Calibration Panel */}
          <div className={`p-6 transition-colors border-b ${isCalibrated ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{isCalibrated ? '✅' : '📐'}</span>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${isCalibrated ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isCalibrated ? 'Screen Calibrated' : 'Calibration Required'}
                  </h3>
                  <p className={`text-[10px] font-bold ${isCalibrated ? 'text-emerald-600/70' : 'text-amber-600/70'}`}>
                    {isCalibrated 
                      ? 'Pendant sizes on screen now match your real-life measurements' 
                      : 'Use a digital caliper to measure the bar below, then enter the reading'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                  <input 
                    className="w-20 outline-none text-sm font-bold text-center"
                    type="number" 
                    placeholder="e.g. 47.32"
                    value={calibInput}
                    onChange={(e) => setCalibInput(e.target.value)}
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase ml-2">mm</span>
                </div>
                <button 
                  onClick={applyCalibration}
                  className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#947a46] transition-all shadow-md"
                >
                  {isCalibrated ? 'Recalibrate' : '✓ Calibrate'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-0 max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-6 h-14 bg-slate-700 rounded-sm" />
                <div className="w-3 h-8 bg-slate-800 rounded-sm -mt-4 self-end" />
              </div>
              <div className="flex-1 flex flex-col items-center px-2 space-y-2">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Place jaws here ↓</div>
                <div 
                  className="h-10 border-2 border-rose-600 rounded-md flex items-center justify-center bg-rose-50 shadow-inner overflow-hidden relative"
                  style={{ width: (CALIB_REF_MM * pxPerMm) + 'px' }}
                >
                   <div className="absolute inset-0 opacity-10" style={{ background: 'repeating-linear-gradient(45deg, #e11d48, #e11d48 10px, transparent 10px, transparent 20px)' }} />
                   <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest relative z-10">Measure This Bar</span>
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  {isCalibrated ? `✓ ${pxPerMm.toFixed(3)} px/mm` : 'Waiting for calibration...'}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-8 bg-slate-800 rounded-sm mb-[-16px] self-start" />
                <div className="w-6 h-14 bg-slate-700 rounded-sm" />
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto p-12 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
            <div className="flex flex-col items-center space-y-8">
              {/* Top Ruler */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center space-x-0">
                  <div className="w-0.5 h-3 bg-slate-400" />
                  <div className="h-0.5 bg-slate-300 shadow-sm" style={{ width: wPx + 'px' }} />
                  <div className="w-0.5 h-3 bg-slate-400" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                  {clampedW.toFixed(2)}mm
                </span>
              </div>

              {/* Pendant Stage */}
              <div className="relative group" style={{ width: wPx + 'px', height: hPx + 'px' }}>
                <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 w-4 h-5 border-2 border-slate-400 border-b-0 rounded-t-lg" />
                <div className="absolute inset-0 border-2 border-slate-900/10 rounded shadow-sm bg-white/50 backdrop-blur-[2px]" />
                <div 
                  className="relative z-10 whitespace-nowrap leading-none flex items-center justify-center h-full transition-all duration-200"
                  style={{ 
                    fontFamily: `'${state.fontFam}', cursive, serif`,
                    fontSize: fontSize + 'px',
                    color: state.color
                  }}
                >
                  {state.name || '—'}
                </div>
              </div>

              {/* Side Ruler */}
              <div className="flex items-center space-x-3">
                 <div className="flex flex-col items-center justify-center space-y-0">
                  <div className="w-3 h-0.5 bg-slate-400" />
                  <div className="w-0.5 bg-slate-300 shadow-sm" style={{ height: hPx + 'px' }} />
                  <div className="w-3 h-0.5 bg-slate-400" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                  {state.heightMM}mm
                </span>
              </div>
            </div>
          </div>

          {/* Caliper Bar (Footer) */}
          <footer className="bg-[#0f172a] p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-20">
             <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  {/* LCD Display Units */}
                  {[
                    { label: 'Width', val: clampedW.toFixed(2) },
                    { label: 'Height', val: state.heightMM.toFixed(2) },
                    { label: 'Text W', val: textMm },
                  ].map(stat => (
                    <div key={stat.label} className="flex flex-col items-center">
                      <div className="flex items-center space-x-2">
                        <div className="bg-[#b8c9a0] border-2 border-[#5a6a45] rounded-lg px-4 py-2 shadow-inner min-w-[100px] text-right relative overflow-hidden">
                           <div className="absolute inset-0 font-mono text-2xl opacity-10 text-slate-800 pointer-events-none">888.88</div>
                           <span className="font-mono text-2xl text-[#1a2a0a] relative z-10 tracking-tighter">{stat.val}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">mm</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="h-12 w-px bg-slate-800" />

                <div className="flex items-center space-x-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Name:</span>
                      <span className="text-white text-xs font-serif italic truncate max-w-[120px]">{state.name}</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Font:</span>
                      <span className="text-white text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px]">{state.fontName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                       state.widthMM > MAX_WIDTH_MM 
                         ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                         : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                     }`}>
                       {state.widthMM > MAX_WIDTH_MM ? `Width Capped at ${MAX_WIDTH_MM}mm` : 'Perfect Fit'}
                     </span>
                     <div className="flex space-x-2">
                        <button onClick={copyFontName} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">
                          Copy Font
                        </button>
                        <button onClick={savePNG} className="px-4 py-2 bg-[#947a46] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-900/20">
                          Save PNG
                        </button>
                     </div>
                  </div>
                </div>
             </div>
          </footer>
        </main>
      </div>

      {/* Sheet Modal */}
      {isSheetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSheetModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-serif font-black text-[#0f172a] uppercase tracking-wider">Compile to Sheet</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Arranging {batch.length} names on a single PNG sheet
                </p>
              </div>
              <button onClick={() => setIsSheetModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sheet Width (mm)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#947a46] outline-none"
                    type="number" 
                    value={sheetSettings.width}
                    onChange={(e) => setSheetSettings(s => ({ ...s, width: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sheet Height (mm)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#947a46] outline-none"
                    type="number" 
                    value={sheetSettings.height}
                    onChange={(e) => setSheetSettings(s => ({ ...s, height: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gap (mm)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#947a46] outline-none"
                    type="number" 
                    value={sheetSettings.gap}
                    onChange={(e) => setSheetSettings(s => ({ ...s, gap: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Layout Options</span>
                <div className="flex flex-wrap gap-3">
                  {(['row', 'col', 'center'] as const).map(l => (
                    <button 
                      key={l}
                      onClick={() => setSheetSettings(s => ({ ...s, layout: l }))}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        sheetSettings.layout === l 
                          ? 'bg-[#947a46] text-white border-[#947a46] shadow-md' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#947a46]'
                      }`}
                    >
                      {l === 'row' ? '↔ Row by Row' : l === 'col' ? '↕ Column' : '⊞ Centered Grid'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-8">
                 <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-[#947a46] focus:ring-[#947a46]"
                      checked={sheetSettings.showLabels}
                      onChange={(e) => setSheetSettings(s => ({ ...s, showLabels: e.target.checked }))}
                    />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Show Labels</span>
                 </label>
                 <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-[#947a46] focus:ring-[#947a46]"
                      checked={sheetSettings.showOutlines}
                      onChange={(e) => setSheetSettings(s => ({ ...s, showOutlines: e.target.checked }))}
                    />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Show Outlines</span>
                 </label>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 flex items-center justify-center min-h-[250px] shadow-inner">
                <canvas 
                  ref={sheetPreviewCanvasRef} 
                  className="max-w-full max-h-[300px] shadow-2xl rounded-sm bg-white"
                  style={{ background: sheetSettings.bg === 'transparent' ? 'repeating-conic-gradient(#f1f5f9 0% 25%, #fff 0% 50%) 0 0 / 20px 20px' : sheetSettings.bg }}
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
              <button 
                onClick={() => setIsSheetModalOpen(false)}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={downloadSheet}
                className="px-8 py-3 bg-[#947a46] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-yellow-900/20"
              >
                Download Sheet PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Overlay */}
      {showExportOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white/10 p-12 rounded-3xl border border-white/10 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#947a46]/20 border-t-[#947a46] rounded-full animate-spin mb-6" />
              <p className="text-white font-serif italic text-xl">{exportMsg}</p>
           </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-8 right-8 z-[300] bg-[#0f172a] text-white px-8 py-4 rounded-2xl shadow-2xl transition-all duration-500 flex items-center space-x-4 ${
        showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">{toastMsg}</span>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
