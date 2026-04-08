// Utility for base64 conversion and API calls for attachments

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fetchAttachmentImage(url: string, apiKey: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function uploadAttachment({
  url,
  apiKey,
  base64Data,
  method = 'PUT',
  body = {},
}: {
  url: string;
  apiKey: string;
  base64Data: string;
  method?: 'PUT' | 'POST';
  body?: Record<string, unknown>;
}): Promise<boolean> {
  // Send as 'attachmentImage' to match backend
  const res = await fetch(url, {
    method,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, attachmentImage: base64Data }),
  });
  return res.ok;
}
