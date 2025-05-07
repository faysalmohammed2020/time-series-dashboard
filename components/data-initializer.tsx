"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { checkJsonDataExists, convertCsvToJson } from "@/app/actions"
import { Loader2 } from "lucide-react"

interface DataInitializerProps {
  onDataReady: () => void
}

export default function DataInitializer({ onDataReady }: DataInitializerProps) {
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataExists, setDataExists] = useState(false)

  useEffect(() => {
    const checkData = async () => {
      try {
        const result = await checkJsonDataExists()
        setDataExists(result.exists)

        if (result.exists) {
          onDataReady()
        }

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check data status")
        setLoading(false)
      }
    }

    checkData()
  }, [onDataReady])

  const handleConvertData = async () => {
    try {
      setConverting(true)
      setError(null)

      const result = await convertCsvToJson()

      if (result.success) {
        setDataExists(true)
        onDataReady()
      } else {
        setError(result.message || "Failed to convert data")
      }

      setConverting(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Checking data status...</h3>
        </div>
      </div>
    )
  }

  if (!dataExists) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <h2 className="text-2xl font-bold">Data Initialization Required</h2>
          <p className="text-muted-foreground">
            The time series data needs to be converted from CSV to JSON format before it can be displayed.
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleConvertData} disabled={converting}>
            {converting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting Data...
              </>
            ) : (
              "Convert CSV to JSON"
            )}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
