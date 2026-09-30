// Helper lampiran: gambar (resize) & PDF (ekstrak teks).
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Batas kecil sesuai permintaan: 4 MB per file.
export const MAX_FILE_MB = 4;
export const MAX_IMAGES = 4;

export const isWithinLimit = (file) => file.size <= MAX_FILE_MB * 1024 * 1024;

export const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

// Kecilkan gambar via canvas → data URL JPEG (hemat token & kuota).
export const downscaleImage = (dataUrl, maxDim = 1024, quality = 0.85) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("gagal membaca gambar"));
    img.src = dataUrl;
  });

// Thumbnail mungil untuk disimpan di histori localStorage (hemat kuota).
export const makeThumb = (dataUrl) => downscaleImage(dataUrl, 256, 0.7);

// Ambil teks dari PDF (maks 20 halaman / 12000 karakter).
export const extractPdfText = async (file, maxPages = 20, maxChars = 12000) => {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const n = Math.min(pdf.numPages, maxPages);
  let text = "";
  for (let i = 1; i <= n && text.length < maxChars; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += `\n\n--- Halaman ${i} ---\n` + content.items.map((it) => it.str).join(" ");
  }
  return text.slice(0, maxChars).trim();
};
