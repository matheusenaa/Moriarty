import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: {
      // Teto do corpo da requisição nas Server Actions. Na Vercel o limite da
      // plataforma é 4,5 MB — o upload de arquivos do Moriarty respeita esse valor.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
