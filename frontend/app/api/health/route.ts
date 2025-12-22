import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'NVIDIA Doc Navigator',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        features: {
            nvidia_nim: !!process.env.NVIDIA_API_KEY,
            model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-r1',
        }
    });
}
