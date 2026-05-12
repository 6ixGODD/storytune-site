import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [],
    },
    experimental: {
        // Limit parallel build workers to avoid Windows worker crash (STATUS_STACK_BUFFER_OVERRUN)
        // with many simultaneous MongoDB connections + heavy module compilation.
        cpus: 4,
    },
};

export default nextConfig;
