import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received file upload request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided in the request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

    // Get the Python API URL from environment variables or use a default
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    console.log(`Using Python API URL: ${pythonApiUrl}`);
    
    // Create a new FormData object to send to the Python API
    const apiFormData = new FormData();
    apiFormData.append('file', file);

    // Send the file to the Python API
    console.log(`Sending request to ${pythonApiUrl}/api/process`);
    const response = await fetch(`${pythonApiUrl}/api/process`, {
      method: 'POST',
      body: apiFormData,
    });

    console.log(`Received response with status: ${response.status}`);

    // Get the response from the Python API
    const data = await response.json();
    
    // Return the response with the appropriate status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 