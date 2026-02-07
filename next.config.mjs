/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    experimental: {
        // Use system TLS certificates to fix font loading issues
        turbopackUseSystemTlsCerts: true,
    },
};

export default nextConfig;
