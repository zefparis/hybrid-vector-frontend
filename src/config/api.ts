/**
 * Centralized API configuration
 * All API URLs and keys should be accessed through this file
 */

const API_URL = import.meta.env.VITE_HV_API_URL as string
const API_KEY = import.meta.env.VITE_HV_API_KEY as string
const TENANT_ID = import.meta.env.VITE_TENANT_ID as string
const INSTITUTION_ID = import.meta.env.VITE_INSTITUTION_ID as string

// Fallback for missing env vars
if (!API_URL) {
  console.error('[API Config] VITE_HV_API_URL is not set')
}

if (!API_KEY) {
  console.warn('[API Config] VITE_HV_API_KEY is not set')
}

export const config = {
  apiUrl: API_URL || 'https://hybrid-vector-api.fly.dev',
  apiKey: API_KEY || '',
  tenantId: TENANT_ID || 'demo-tenant',
  institutionId: INSTITUTION_ID || 'demo-university',
} as const

/**
 * Helper to build full API endpoint URLs
 */
export const apiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${config.apiUrl}${cleanPath}`
}

/**
 * Frontend enrollment URL (for QR codes, etc.)
 */
export const FRONTEND_URL = 'https://hybrid-vector-frontend.vercel.app'

export const enrollmentUrl = (path: string = '/edguard/enroll'): string => {
  return `${FRONTEND_URL}${path}`
}
