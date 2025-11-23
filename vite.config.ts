import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 关键：强制将 process.env.API_KEY 替换为实际的值
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
