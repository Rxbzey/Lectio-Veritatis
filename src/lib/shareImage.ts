import { toBlob, toPng } from 'html-to-image';

export interface ShareImageOptions {
  pixelRatio?: number;
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: ShareImageOptions = {
  pixelRatio: 2,
  backgroundColor: '#000000',
};

export async function generateSharePng(node: HTMLElement, options: ShareImageOptions = {}): Promise<string> {
  return toPng(node, { ...DEFAULT_OPTIONS, ...options });
}

export async function generateShareBlob(node: HTMLElement, options: ShareImageOptions = {}): Promise<Blob | null> {
  return toBlob(node, { ...DEFAULT_OPTIONS, ...options });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
