'use client';

import { useState, useRef } from 'react';
import { uploadCannonImage } from '~lib/actions/upload-image-s3';
import Image from 'next/image';

export function ImageUploader({ cannonId }: { cannonId: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    setError(null);
    try {
      const result = await uploadCannonImage(cannonId, file);
      console.log('Success! Image URL:', result.url);
      // TODO: Update UI to show the image
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        onChange={handleChange}
        disabled={loading}
        hidden
      />
      <button onClick={() => inputRef.current?.click()} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload image'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {preview && (
        <div>
          <Image src={preview} alt='Preview' style={{ maxWidth: '200px', marginTop: '1rem' }} />
        </div>
      )}
    </div>
  );
}
