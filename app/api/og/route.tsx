import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters from URL
    const title = searchParams.get('title') || 'Onchain Chatbot';
    const subtitle = searchParams.get('subtitle') || 'AI Assistant for Web3';
    const theme = searchParams.get('theme') || 'dark'; // 'light' or 'dark'

    // Load League Spartan font
    const leagueSpartanRegular = await fetch(
      new URL(
        'https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700&display=swap',
      ),
    ).then((res) => res.text());

    // Extract font URL from CSS
    const fontUrl = leagueSpartanRegular.match(/url\(([^)]+)\)/)?.[1];
    let fontData: ArrayBuffer | undefined;

    if (fontUrl) {
      fontData = await fetch(fontUrl.replace(/['"]/g, '')).then((res) =>
        res.arrayBuffer(),
      );
    }

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0a0a0a' : '#ffffff';
    const textColor = isDark ? '#ffffff' : '#000000';
    const accentColor = isDark ? '#ffffff' : '#000000';

    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bgColor,
          backgroundImage: isDark
            ? 'radial-gradient(circle at 25% 25%, #1f1f1f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a1a 0%, transparent 50%)'
            : 'radial-gradient(circle at 25% 25%, #f5f5f5 0%, transparent 50%), radial-gradient(circle at 75% 75%, #f0f0f0 0%, transparent 50%)',
          fontFamily: '"League Spartan", sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            left: '60px',
            width: '100px',
            height: '100px',
            border: `2px solid ${accentColor}`,
            borderRadius: '50%',
            opacity: 0.1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '80px',
            width: '120px',
            height: '120px',
            border: `2px solid ${accentColor}`,
            borderRadius: '12px',
            opacity: 0.1,
            transform: 'rotate(45deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '200px',
            right: '200px',
            width: '60px',
            height: '60px',
            backgroundColor: accentColor,
            borderRadius: '50%',
            opacity: 0.05,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '900px',
            padding: '0 60px',
          }}
        >
          {/* Robot emoji as logo */}
          <div
            style={{
              fontSize: '120px',
              marginBottom: '40px',
              opacity: 0.9,
            }}
          >
            🤖
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '700',
              color: textColor,
              margin: '0 0 20px 0',
              lineHeight: '1.1',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '32px',
              fontWeight: '400',
              color: textColor,
              margin: '0',
              opacity: 0.7,
              lineHeight: '1.3',
            }}
          >
            {subtitle}
          </p>

          {/* Accent line */}
          <div
            style={{
              width: '200px',
              height: '4px',
              backgroundColor: accentColor,
              marginTop: '40px',
              borderRadius: '2px',
              opacity: 0.8,
            }}
          />
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '60px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: textColor,
            opacity: 0.4,
          }}
        >
          ⛓️ Blockchain Powered
        </div>
      </div>,
      {
        width: 1200,
        height: 800,
        fonts: fontData
          ? [
              {
                name: 'League Spartan',
                data: fontData,
                style: 'normal',
                weight: 400,
              },
            ]
          : [],
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
