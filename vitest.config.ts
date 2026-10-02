/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro의 Vite 설정(tsconfig paths 등)을 그대로 사용한다.
export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
