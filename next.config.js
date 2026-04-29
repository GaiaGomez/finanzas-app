// @ts-check
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || process.env.DISABLE_PWA === "true",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true };
module.exports = withPWA(nextConfig);
