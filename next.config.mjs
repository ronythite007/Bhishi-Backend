import path from "path";

/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isVercel ? {} : { outputFileTracingRoot: path.join(process.cwd(), "..") }),
};

export default nextConfig;
