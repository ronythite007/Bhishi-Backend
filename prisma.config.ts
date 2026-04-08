import { defineConfig, env } from "prisma/config";

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "../database/prisma/schema.prisma",
  migrations: {
    path: "../database/prisma/migrations",
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});