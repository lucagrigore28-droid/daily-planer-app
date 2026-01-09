import { NextRequest, NextResponse } from 'next/server';
import satori from 'satori';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

// This function can be marked `async` if using `await` inside
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sizeParam = searchParams.get('size');
        const size = sizeParam ? parseInt(sizeParam) : 192;
        
        // Construct an absolute path to the SVG file
        const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
        const svg = await fs.readFile(svgPath, 'utf-8');

        // Convert SVG to PNG using satori and sharp
        const pngBuffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

        return new NextResponse(pngBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000, immutable'
            },
        });
    } catch (error) {
        console.error("Error generating icon:", error);
        return new NextResponse('Error generating icon', { status: 500 });
    }
}
