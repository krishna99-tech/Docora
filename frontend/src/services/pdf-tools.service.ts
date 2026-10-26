import { HttpClient, httpClient } from './http-client';
import { API_ROUTES } from '@/constants';

export class PdfToolsService {
  constructor(private http: HttpClient = httpClient) {}

  async pdfMerge(formData: FormData): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.PDF_TOOLS.MERGE, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfCompress(formData: FormData, download = true): Promise<Blob> {
    const endpoint = `${API_ROUTES.PDF_TOOLS.COMPRESS}?download=${download}`;
    return this.http.requestBlob(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfRotate(formData: FormData): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.PDF_TOOLS.ROTATE, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfWatermark(formData: FormData): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.PDF_TOOLS.WATERMARK, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfPageNumbers(formData: FormData): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.PDF_TOOLS.PAGE_NUMBERS, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfImagesToPdf(formData: FormData): Promise<Blob> {
    return this.http.requestBlob(API_ROUTES.PDF_TOOLS.IMAGES_TO_PDF, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfMetadata(formData: FormData): Promise<any> {
    return this.http.request<any>(API_ROUTES.PDF_TOOLS.METADATA, {
      method: 'POST',
      body: formData,
    });
  }

  async pdfGetJobs(): Promise<any[]> {
    return this.http.request<any[]>(API_ROUTES.PDF_TOOLS.JOBS);
  }

  async listPdfJobs(): Promise<any[]> {
    return this.http.request<any[]>(API_ROUTES.PDF_TOOLS.JOBS);
  }
}

export const pdfToolsService = new PdfToolsService();
