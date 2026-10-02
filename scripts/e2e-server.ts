/**
 * E2E 테스트 서버
 * `--mode test`로 dist-test/에 빌드(개발용 /dev/components 포함)한 뒤 preview로 서빙한다.
 * production 빌드(dist/)에는 영향을 주지 않는다.
 */
import { build, preview } from 'astro';

const outDir = './dist-test';
const port = Number(process.env.PORT ?? 4321);

await build({ mode: 'test', outDir, logLevel: 'warn' });
await preview({ outDir, server: { host: '127.0.0.1', port }, logLevel: 'warn' });
