export type ThermalReceiptLine = {
  name: string;
  code?: string | null;
  serial?: string | null;
  quantity?: number | null;
};

export type ThermalReceiptData = {
  brand: string;
  title: string;
  number: string;
  date: string;
  recipientLabel: string;
  recipient: string;
  status?: string | null;
  note?: string | null;
  lines: ThermalReceiptLine[];
};

function escapeHtml(value: unknown) {
  return String(value ?? "-").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function printThermalReceipt(receipt: ThermalReceiptData) {
  const printWindow = window.open("", "_blank", "width=420,height=720");
  if (!printWindow) return false;

  let didPrint = false;
  const printWhenReady = () => {
    if (didPrint || printWindow.closed) return;
    didPrint = true;
    printWindow.focus();
    printWindow.print();
  };

  printWindow.addEventListener(
    "load",
    () => window.setTimeout(printWhenReady, 100),
    { once: true },
  );

  const lines = receipt.lines.map((line, index) => `
    <div class="item">
      <div class="item-title"><span>${index + 1}. ${escapeHtml(line.name)}</span><strong>×${escapeHtml(line.quantity ?? 1)}</strong></div>
      ${line.code ? `<div class="sub">Code: ${escapeHtml(line.code)}</div>` : ""}
      ${line.serial ? `<div class="sub serial">Serial: ${escapeHtml(line.serial)}</div>` : ""}
    </div>
  `).join("");

  printWindow.document.write(`<!doctype html>
    <html><head><meta charset="utf-8"><title>${escapeHtml(receipt.number)}</title>
    <style>
      @page { size: 80mm 200mm; margin: 2mm; }
      * { box-sizing: border-box; }
      html, body { width: 76mm; margin: 0; padding: 0; }
      body { color: #111; font: 11px/1.35 Arial, sans-serif; }
      .receipt { width: 76mm; padding: 1mm 0 3mm; }
      .center { text-align: center; }
      .brand { font-size: 15px; font-weight: 800; }
      .title { margin-top: 2px; font-size: 12px; font-weight: 700; }
      .rule { border: 0; border-top: 1px dashed #222; margin: 7px 0; }
      .meta { display: grid; grid-template-columns: 21mm 1fr; gap: 3px 2mm; overflow-wrap: anywhere; }
      .label { color: #444; }
      .value { font-weight: 700; }
      .items-heading { margin: 7px 0 2px; font-weight: 700; }
      .item { padding: 4px 0; border-bottom: 1px dashed #999; overflow-wrap: anywhere; }
      .item-title { display: flex; justify-content: space-between; gap: 4px; font-weight: 700; }
      .sub { margin-top: 2px; color: #333; font-size: 10px; }
      .serial { font-family: monospace; }
      .note { margin-top: 6px; overflow-wrap: anywhere; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 18mm; }
      .signature { padding-top: 3mm; border-top: 1px solid #222; text-align: center; font-size: 9px; }
      .footer { margin-top: 7mm; text-align: center; font-size: 9px; }
      @media print { html, body { width: 76mm; } }
    </style></head><body><main class="receipt">
      <header class="center"><div class="brand">${escapeHtml(receipt.brand)}</div><div class="title">${escapeHtml(receipt.title)}</div></header>
      <hr class="rule">
      <div class="meta">
        <span class="label">Voucher No.</span><span class="value">${escapeHtml(receipt.number)}</span>
        <span class="label">Date</span><span>${escapeHtml(receipt.date)}</span>
        <span class="label">${escapeHtml(receipt.recipientLabel)}</span><span class="value">${escapeHtml(receipt.recipient)}</span>
        ${receipt.status ? `<span class="label">Status</span><span>${escapeHtml(receipt.status)}</span>` : ""}
      </div>
      <hr class="rule"><div class="items-heading">ITEMS (${receipt.lines.length})</div>${lines || "<div>No items</div>"}
      ${receipt.note ? `<div class="note"><strong>Note:</strong> ${escapeHtml(receipt.note)}</div>` : ""}
      <div class="signatures"><div class="signature">Issued by</div><div class="signature">Received by</div></div>
      <hr class="rule"><div class="footer">Thank you</div>
    </main></body></html>`);
  printWindow.document.close();
  window.setTimeout(printWhenReady, 500);
  return true;
}
