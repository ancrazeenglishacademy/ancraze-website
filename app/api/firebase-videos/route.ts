import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    if (!adminStorage) {
      throw new Error('Firebase Admin Storage not available');
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix') || ''; // optional folder filter

    const bucket = adminStorage.bucket();

    // List all files in the bucket (optionally with prefix)
    const [files] = await bucket.getFiles({ prefix: prefix || undefined });

    // Filter to only video files and build response
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogv', '.flv'];

    const videos = await Promise.all(
      files
        .filter((file: any) => {
          const nameLower = file.name.toLowerCase();
          return videoExtensions.some((ext) => nameLower.endsWith(ext));
        })
        .map(async (file: any) => {
          try {
            // Get a signed URL valid for 7 days, or use the public URL if the file is public
            const [metadata] = await file.getMetadata();
            
            // Try to get a download URL (public URL format for Firebase Storage)
            const encodedName = encodeURIComponent(file.name);
            const bucketName = bucket.name;
            const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedName}?alt=media`;

            // Extract a clean display name
            const parts = file.name.split('/');
            const fileName = parts[parts.length - 1];
            const folder = parts.slice(0, -1).join('/');

            return {
              name: fileName,
              fullPath: file.name,
              folder: folder || '/',
              downloadUrl,
              size: parseInt(metadata.size || '0'),
              contentType: metadata.contentType || 'video/mp4',
              updated: metadata.updated || new Date().toISOString(),
            };
          } catch {
            return null;
          }
        })
    );

    const validVideos = videos.filter(Boolean);

    // Sort by updated date descending (newest first)
    validVideos.sort((a: any, b: any) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

    return NextResponse.json(
      {
        success: true,
        videos: validVideos,
        total: validVideos.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error listing Firebase videos:', error);
    return NextResponse.json(
      {
        error: 'Failed to list videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
