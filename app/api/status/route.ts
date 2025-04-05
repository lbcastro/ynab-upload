import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('Received status check request');
    
    // Get the Python API URL from environment variables or use a default
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    console.log(`Using Python API URL for status check: ${pythonApiUrl}`);
    
    // Send a request to the Python API status endpoint
    console.log(`Sending request to ${pythonApiUrl}/api/status`);
    const response = await fetch(`${pythonApiUrl}/api/status`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    console.log(`Received status response with status code: ${response.status}`);

    // Get the response from the Python API
    const data = await response.json();
    console.log(`Status data: ${JSON.stringify(data)}`);
    
    // Return the response with the appropriate status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 