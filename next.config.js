const { webpack } = require("next/dist/compiled/webpack/webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
                resource.request = resource.request.replace(/^node:/, "");
            })
        );

        config.experiments = { ...config.experiments, topLevelAwait: true };

        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                net: false,
                tls: false,
                fs: false,
                dns: false,
                path: false,
                stream: false
            };
        }

        return config;
    },
    experimental: { 
        appDir: true 
    }
};

module.exports = nextConfig;