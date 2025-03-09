import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file to disk
    const filePath = path.join(process.cwd(), file.name);
    await writeFile(filePath, buffer);

    // Run the Python script with the specific file
    const pythonProcess = spawn('python3', [path.join(process.cwd(), 'personal.py'), filePath], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return new Promise<NextResponse>((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          // Check for rate limit errors
          if (stdout.includes('Rate limit reached')) {
            resolve(NextResponse.json({
              error: 'YNAB API rate limit reached. The system is automatically retrying with exponential backoff. Please wait...',
              details: stdout,
              code
            }, { status: 429 }));
          } else {
            resolve(NextResponse.json({
              error: 'Upload failed',
              details: stderr || stdout,
              code
            }, { status: 500 }));
          }
        } else {
          resolve(NextResponse.json({
            message: 'Upload successful',
            details: stdout
          }));
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 