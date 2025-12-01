import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Vercel'deki veya .env dosyasındaki değişkenleri yükle
  // 3. parametre '' olduğu için önek (prefix) aramadan tüm değişkenleri yükler
  // Fix: process.cwd() TS error by casting process to any
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Kod içinde 'process.env.API_KEY' geçen yerleri gerçek anahtar değeriyle değiştir
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});