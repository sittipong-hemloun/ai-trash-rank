import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Initialize the Neon database connection
const sql = neon(process.env.DATABASE || "")

// Initialize Drizzle ORM with the Neon connection and schema
export const db = drizzle(sql, { schema })