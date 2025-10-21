import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

// Allowed file types for screenshots
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Helper function to validate file type
function isValidFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(mimeType);
}

// Helper function to generate a unique filename
function generateFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // Use first part of UUID
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}_${timestamp}_${uuid}.${extension}`;
}

// POST /api/upload - Handle file upload
export async function POST(request: NextRequest) {
  try {
    // Get the session to authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          details: `Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          details: `Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const filename = generateFilename(file.name, session.user.id);

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create user-specific subdirectory
    const userUploadDir = join(uploadsDir, session.user.id);
    if (!existsSync(userUploadDir)) {
      await mkdir(userUploadDir, { recursive: true });
    }

    // Write file to disk
    const filepath = join(userUploadDir, filename);
    await writeFile(filepath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/${session.user.id}/${filename}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: publicUrl,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type
    }, { status: 201 });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: DELETE /api/upload - Handle file deletion
export async function DELETE(request: NextRequest) {
  try {
    // Get the session to authenticate the user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Validate that the filename belongs to the authenticated user
    if (!filename.startsWith(session.user.id + '_')) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    const filepath = join(
      process.cwd(),
      'public',
      'uploads',
      session.user.id,
      filename
    );

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Delete the file
    const { unlink } = await import('fs/promises');
    await unlink(filepath);

    return NextResponse.json({
      message: "File deleted successfully",
    });

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}