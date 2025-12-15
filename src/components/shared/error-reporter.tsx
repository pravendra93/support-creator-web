'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export function ErrorReporter() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            logger.error('Uncaught Exception', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            })
        }

        const handleRejection = (event: PromiseRejectionEvent) => {
            logger.error('Unhandled Promise Rejection', {
                reason: event.reason
            })
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleRejection)

        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleRejection)
        }
    }, [])

    return null
}
