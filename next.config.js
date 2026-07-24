/** @type {import('next').NextConfig} */

// Supabase Storage public URL을 next/image로 최적화하기 위한 허용 패턴.
// 호스트는 빌드 시점 환경변수에서 파생한다 (키가 아니라 URL이므로 노출 무해).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "vdnhdncxmkzcmqmvqgfb.supabase.co";
  }
})();

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
