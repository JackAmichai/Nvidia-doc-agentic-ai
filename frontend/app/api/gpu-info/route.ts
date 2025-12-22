import { NextResponse } from 'next/server';

export async function GET() {
    // Demo GPU data for serverless deployment
    // Real GPU metrics require server with physical GPU access
    
    const demoGpuInfo = {
        available: false,
        message: 'GPU metrics require server deployment with physical GPU access',
        demo_data: {
            gpus: [
                {
                    name: 'NVIDIA A100-SXM4-40GB',
                    uuid: 'GPU-demo-0000-0000-0000-000000000000',
                    memory: {
                        total_mb: 40960,
                        used_mb: 8192,
                        free_mb: 32768,
                    },
                    utilization: {
                        gpu_percent: 45,
                        memory_percent: 20,
                    },
                    temperature_c: 42,
                    power_draw_w: 125,
                    power_limit_w: 400,
                    compute_mode: 'Default',
                    mig_mode: true,
                    mig_devices: [
                        { profile: '1g.5gb', id: 0, memory_mb: 5120 },
                        { profile: '2g.10gb', id: 1, memory_mb: 10240 },
                        { profile: '3g.20gb', id: 2, memory_mb: 20480 }
                    ]
                }
            ],
            driver_version: '535.104.12',
            cuda_version: '12.2',
        },
        nvidia_technologies: ['cuda', 'mig', 'nvml'],
        note: 'This is demo data. Deploy with GPU access for real metrics.'
    };

    return NextResponse.json(demoGpuInfo);
}
