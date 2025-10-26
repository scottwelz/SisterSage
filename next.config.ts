import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Mark server-only packages
  serverExternalPackages: ['genkit', '@genkit-ai/googleai'],

  webpack: (config, { isServer }) => {
    // Fix for OpenTelemetry and Genkit - exclude Node.js built-ins from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        perf_hooks: false,
        diagnostics_channel: false,
        inspector: false,
        worker_threads: false,
      };

      // Completely ignore these packages in client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        'genkit': false,
        '@genkit-ai/googleai': false,
        '@opentelemetry/api': false,
        '@opentelemetry/instrumentation': false,
        '@opentelemetry/context-async-hooks': false,
        '@opentelemetry/sdk-trace-base': false,
        '@opentelemetry/sdk-trace-node': false,
      };
    }

    return config;
  },
};

export default nextConfig;