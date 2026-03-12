import type { ServiceRequest, TakeoffItem } from "@/lib/types";

/** Build CSV content for a request (bid-ready export) */
export function requestToCSV(request: ServiceRequest): string {
  const rows: string[][] = [
    ["Al-Measure Takeoff Export"],
    ["Request", request.title],
    ["Category", request.category],
    ["Status", request.status],
    ["Property Address", request.propertyAddress || ""],
    ["Property Size", String(request.propertySize ?? "")],
    ["Created", request.createdAt],
    [],
    ["Label", "Type", "Area (sq ft)", "Length (ft)", "Unit"],
  ];

  const items = request.takeoffItems || [];
  if (items.length === 0 && request.propertySize) {
    rows.push(["Lot Total", "polygon", String(request.propertySize), "", "sq ft"]);
  } else {
    items.forEach((item) => {
      rows.push([
        item.label,
        item.type,
        item.area != null ? String(item.area) : "",
        item.length != null ? String(item.length) : "",
        item.unit || "sq ft",
      ]);
    });
  }

  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

/** Trigger CSV download */
export function downloadCSV(request: ServiceRequest, filename?: string) {
  const csv = requestToCSV(request);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `takeoff-${request.id || "export"}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build printable HTML for PDF (use window.print() or browser Print) */
export function requestToPrintHTML(request: ServiceRequest): string {
  const items = request.takeoffItems || [];
  const rows = items.length
    ? items
        .map(
          (i) =>
            `<tr><td>${escapeHtml(i.label)}</td><td>${i.type}</td><td>${i.area ?? ""}</td><td>${i.length ?? ""}</td><td>${i.unit}</td></tr>`
        )
        .join("")
    : request.propertySize
      ? `<tr><td>Lot Total</td><td>polygon</td><td>${request.propertySize}</td><td></td><td>sq ft</td></tr>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Takeoff: ${escapeHtml(request.title)}</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 24px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin-bottom: 8px; }
  .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; }
</style>
</head>
<body>
  <h1>${escapeHtml(request.title)}</h1>
  <div class="meta">
    Category: ${escapeHtml(request.category)} | Status: ${request.status} | Address: ${escapeHtml(request.propertyAddress || "-")}<br>
    Created: ${request.createdAt}
  </div>
  <table>
    <thead><tr><th>Label</th><th>Type</th><th>Area (sq ft)</th><th>Length (ft)</th><th>Unit</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top: 24px; font-size: 0.875rem; color: #666;">Exported from Al-Measure. Manual takeoff — no AI.</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/** Open print dialog for request (PDF via "Save as PDF") */
export function printRequest(request: ServiceRequest) {
  const html = requestToPrintHTML(request);
  const w = window.open("", "_blank");
  if (!w) {
    console.error("Popup blocked");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 250);
}
