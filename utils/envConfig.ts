import { loadEnvConfig } from '@next/env'

// Loads environment variables from .env files
const projectDir = process.cwd()
loadEnvConfig(projectDir)