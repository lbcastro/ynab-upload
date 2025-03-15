import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Get the Python API URL from environment variables or use a default
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5000';
    
    // Send a request to the Python API status endpoint
    const response = await fetch(`${pythonApiUrl}/api/status`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    // Get the response from the Python API
    const data = await response.json();
    
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