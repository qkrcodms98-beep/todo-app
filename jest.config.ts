import type { Config } from "jest";
import nextJest from "next/jest.js";

// Next.js 설정(next.config.ts)을 읽어서 Jest 설정을 만든다
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // 브라우저를 흉내 내는 환경에서 테스트한다
  testEnvironment: "jsdom",
  // 테스트를 돌리기 전에 먼저 읽는 파일
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // 테스트는 __tests__ 폴더에 모은다
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  // "@/types/todo" 같은 경로를 src/ 폴더로 연결한다
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig(config);
