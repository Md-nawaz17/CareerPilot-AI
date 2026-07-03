declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  import { PDFDocumentProxy, PDFPageProxy, GlobalWorkerOptionsType } from 'pdfjs-dist/types/src/pdf';
  export const GlobalWorkerOptions: GlobalWorkerOptionsType;
  export function getDocument(src: any): any;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
