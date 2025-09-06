import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_URL_SIRA_BACK || 'https://app.nuvoox.com/web/nuvoox/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/webchat/config`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No configuration exists yet, return empty config
        return NextResponse.json(null, { status: 404 });
      }
      
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Backend request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('WebChat config GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Validate color formats
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (body.brand_primary && !hexColorRegex.test(body.brand_primary)) {
      return NextResponse.json(
        { error: 'brand_primary must be a valid hex color' },
        { status: 400 }
      );
    }
    
    if (body.brand_text && !hexColorRegex.test(body.brand_text)) {
      return NextResponse.json(
        { error: 'brand_text must be a valid hex color' },
        { status: 400 }
      );
    }

    // Validate position
    if (body.position && !['right', 'left'].includes(body.position)) {
      return NextResponse.json(
        { error: 'position must be either "right" or "left"' },
        { status: 400 }
      );
    }

    // Validate welcome_text length
    if (body.welcome_text && body.welcome_text.length > 500) {
      return NextResponse.json(
        { error: 'welcome_text must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Validate allowed_origins format
    if (body.allowed_origins && Array.isArray(body.allowed_origins)) {
      for (const origin of body.allowed_origins) {
        if (typeof origin !== 'string' || !origin.trim()) {
          return NextResponse.json(
            { error: 'All allowed_origins must be non-empty strings' },
            { status: 400 }
          );
        }
        
        // Basic URL validation
        try {
          new URL(origin);
        } catch (e) {
          return NextResponse.json(
            { error: `Invalid URL format in allowed_origins: ${origin}` },
            { status: 400 }
          );
        }
      }
    }

    const response = await fetch(`${BACKEND_URL}/webchat/config`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Backend request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('WebChat config POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
