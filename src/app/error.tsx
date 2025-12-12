'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        logger.error('Client Error Caught', {
            message: error.message,
            stack: error.stack,
            digest: error.digest,
        })
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center px-4">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground">
                    We apologize for the inconvenience. The error has been logged.
                </p>
            </div>
            <Button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </Button>
        </div>
    )
}
