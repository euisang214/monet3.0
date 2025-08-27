'use client';

interface ResumePreviewProps {
  url: string;
}

export default function ResumePreview({ url }: ResumePreviewProps) {
  return (
    <iframe
      src={url}
      style={{ width: '100%', height: '600px', border: 'none', marginTop: 8 }}
      title="Resume preview"
    />
  );
}
