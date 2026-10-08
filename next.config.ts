import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.105', 'sweet-zoos-shout.loca.lt'],
  env: {
    MY_AWS_REGION: process.env.MY_AWS_REGION || 'eu-north-1',
    MY_AWS_ACCESS_KEY_ID: process.env.MY_AWS_ACCESS_KEY_ID,
    MY_AWS_SECRET_ACCESS_KEY: process.env.MY_AWS_SECRET_ACCESS_KEY,
  }
};

export default nextConfig;
