import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "sysfnzfratjaoffdpyul.supabase.co",
                port: "", // Leave empty if on standard port (443 for https)
                pathname: "/storage/v1/object/public/**", // Use a wildcard if images are in multiple paths
            },
        ],
    },
};

export default nextConfig;
