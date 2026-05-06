'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

const TEN_MEGABYTE = 10 * 1024 * 1024;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadCannonImage(cannonId: string, file: File) {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  if (file.size > TEN_MEGABYTE) {
    throw new Error('Image must be under 10MB');
  }

  // Generate key: cannons/uuid/timestamp.jpg
  const ext = file.type.split('/')[1];
  const key = `cannons/${cannonId}/${Date.now()}.${ext}`;

  // Upload to S3
  const buffer = await file.arrayBuffer();
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: file.type,
        CacheControl: 'max-age=31536000', // 1 year cache
      }),
    );
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Upload failed: ${error}`);
  }

  // Build CloudFront URL
  const imageUrl = `https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/${key}`;

  // TODO: Update database with imageUrl and key
  console.log('Uploaded to:', imageUrl);

  revalidatePath('/');
  return { url: imageUrl, key };
}
