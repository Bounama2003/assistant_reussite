import api from '@/services/api';
import { toast } from './ui';

export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let fileName = filename;

    if (!fileName && contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+?)"?$/);
      if (match) fileName = match[1];
    }

    if (!fileName) {
      const parts = url.split('/');
      fileName = parts[parts.length - 1] || 'download';
    }

    const blob = response.data;
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err: any) {
    const msg = err.response?.data?.detail || err.message || 'Erreur de téléchargement';
    toast.error('Échec du téléchargement', msg);
  }
}
