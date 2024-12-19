export default {
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE,
    connectionString: process.env.DATABASE,
  },
};
