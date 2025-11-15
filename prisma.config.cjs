// Prisma CLI configuration using defineConfig
const { defineConfig } = require('prisma/config');
require('dotenv').config();

module.exports = defineConfig({
  seed: 'tsx prisma/seed.ts',
});
