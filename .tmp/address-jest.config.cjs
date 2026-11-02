module.exports = {
  rootDir: "D:/project/code/jfx/jfx-api",
  testEnvironment: "node",
  transform: { "^.+\\.ts$": ["<rootDir>/node_modules/ts-jest", { tsconfig: "<rootDir>/tsconfig.json" }] },
  moduleNameMapper: { "^src/(.*)$": "<rootDir>/src/$1", "^(\\.{1,2}/.*)\\.js$": "$1" },
  cacheDirectory: "D:/project/code/jfx/jfx-web/.tmp/address-jest-cache",
}
