// Lightweight client-side PDF text extraction using pdfjs-dist (no worker setup needed for short texts).
import * as pdfjs from "pdfjs-dist";
// @ts-expect-error - vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
(pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out;
}
