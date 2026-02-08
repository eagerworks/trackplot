import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["test/javascript/setup.js"],
    include: ["test/javascript/**/*.test.js"]
  }
})
