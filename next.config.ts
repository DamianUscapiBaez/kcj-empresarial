import type { NextConfig } from "next";
const nextConfig: NextConfig = { reactStrictMode: true, serverExternalPackages: ["@prisma/client", "@aws-sdk/client-s3"] };
export default nextConfig;
