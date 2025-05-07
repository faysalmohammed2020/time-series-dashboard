"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import TimeSeriesChart from "@/components/charts/time-series-chart"
import LoadingState from "@/components/loading-state"
import {
  fetchAndParseCSV,
  getNumericColumns,
  getTimeColumns,
  saveDataToLocalStorage,
  loadDataFromLocalStorage,
  isCachedDataFresh,
  forceNumericConversion,
} from "@/lib/data-service"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LineChartsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [useSampleData, setUseSampleData] = useState(false)

  // Define the fields we want to chart
  const desiredFields = [
    "solar",
    "precipitation",
    "strikes",
    "strikeDistance",
    "windSpeed",
    "windDirection",
    "gustWindSpeed",
    "airTemperature",
    "Vapor pressure",
    "atmosphericPressure",
    "R.Humidity",
    "sensorTemp",
    "X orintation",
    "Y orintation",
    "compassHeading",
  ]

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Use sample data if selected
      if (useSampleData) {
        const sampleData = generateWeatherSampleData()
        setData(sampleData)
        setLoading(false)
        return
      }

      // Check if we have fresh cached data and aren't forcing a refresh
      if (!forceRefresh && isCachedDataFresh()) {
        const cachedData = loadDataFromLocalStorage()
        if (cachedData && cachedData.length > 0) {
          console.log("Using cached data from localStorage")

          // Force convert string values to numbers
          const processedData = forceNumericConversion(cachedData)
          setData(processedData)
          setLoading(false)
          return
        }
      }

      // Clear localStorage if forcing refresh
      if (forceRefresh) {
        localStorage.removeItem("timeSeriesData")
        localStorage.removeItem("timeSeriesDataTimestamp")
      }

      // If no cached data or forcing refresh, fetch and parse the CSV
      const csvUrl =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ML-417ADS_125416523_3-FsSETybgez6hFyBBY5nnjA1Ex50wn6.csv"
      const parsedData = await fetchAndParseCSV(csvUrl)

      // Save to localStorage for future use
      saveDataToLocalStorage(parsedData)

      // Update state
      setData(parsedData)
      setLoading(false)
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData(true) // Force refresh from source
    setRefreshing(false)
  }

  const toggleSampleData = () => {
    setUseSampleData(!useSampleData)
  }

  useEffect(() => {
    loadData()
  }, [useSampleData])

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Data</h2>
          <p className="mt-2">{error}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh}>Try Again</Button>
          <Button variant="outline" onClick={toggleSampleData}>
            Use Sample Data
          </Button>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-amber-600">No Data Available</h2>
          <p className="mt-2">No time series data is available to display.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh}>Try Again</Button>
          <Button variant="outline" onClick={toggleSampleData}>
            Use Sample Data
          </Button>
        </div>
      </div>
    )
  }

  // Get columns for visualization
  const numericColumns = getNumericColumns(data)
  console.log("Final numeric columns for visualization:", numericColumns)

  // Get time column if it exists
  const timeColumns = getTimeColumns(data)
  const timeColumn = timeColumns.length > 0 ? timeColumns[0] : Object.keys(data[0])[0]

  // Find available fields in the data
  const availableFields = numericColumns.filter((col) =>
    desiredFields.some(
      (field) =>
        col.toLowerCase().includes(field.toLowerCase()) ||
        col.toLowerCase().replace(/[_\s]/g, "") === field.toLowerCase().replace(/[_\s]/g, ""),
    ),
  )

  // If no fields match exactly, use all numeric columns
  const fieldsToChart = availableFields.length > 0 ? availableFields : numericColumns

  // Check if we have any fields to chart
  const canShowVisualizations = fieldsToChart.length > 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Line Charts</h1>
          <div className="flex gap-2">
            <Button onClick={toggleSampleData} variant="outline">
              {useSampleData ? "Use Real Data" : "Use Sample Data"}
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              {refreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
          </div>
        </div>

        {!canShowVisualizations && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Numeric Data Found</AlertTitle>
            <AlertDescription>
              The data does not contain any numeric columns required for visualization. Try using the sample data
              option.
            </AlertDescription>
          </Alert>
        )}

        {/* Individual line charts for each field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldsToChart.map((field) => (
            <TimeSeriesChart
              key={field}
              data={data}
              timeColumn={timeColumn}
              dataColumns={[field]}
              title={`${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ")} Over Time`}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

// Function to generate sample weather data
function generateWeatherSampleData() {
  const data = []
  const now = new Date()

  // Weather fields
  const fields = [
    "solar",
    "precipitation",
    "strikes",
    "strikeDistance",
    "windSpeed",
    "windDirection",
    "gustWindSpeed",
    "airTemperature",
    "Vapor pressure",
    "atmosphericPressure",
    "R.Humidity",
    "sensorTemp",
    "X orintation",
    "Y orintation",
    "compassHeading",
  ]

  // Generate 100 data points
  for (let i = 0; i < 100; i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000) // Hourly data

    const dataPoint: Record<string, any> = {
      timestamp: date,
    }

    // Generate values for each field
    fields.forEach((field) => {
      // Different ranges for different fields
      switch (field) {
        case "solar":
          dataPoint[field] = Math.random() * 1000 // W/m²
          break
        case "precipitation":
          dataPoint[field] = Math.random() * 10 // mm
          break
        case "strikes":
          dataPoint[field] = Math.floor(Math.random() * 5) // count
          break
        case "strikeDistance":
          dataPoint[field] = Math.random() * 20 // km
          break
        case "windSpeed":
          dataPoint[field] = Math.random() * 15 // m/s
          break
        case "windDirection":
          dataPoint[field] = Math.random() * 360 // degrees
          break
        case "gustWindSpeed":
          dataPoint[field] = Math.random() * 25 // m/s
          break
        case "airTemperature":
          dataPoint[field] = 15 + Math.random() * 15 // °C
          break
        case "Vapor pressure":
          dataPoint[field] = Math.random() * 3 // kPa
          break
        case "atmosphericPressure":
          dataPoint[field] = 990 + Math.random() * 40 // hPa
          break
        case "R.Humidity":
          dataPoint[field] = 30 + Math.random() * 70 // %
          break
        case "sensorTemp":
          dataPoint[field] = 10 + Math.random() * 20 // °C
          break
        case "X orintation":
          dataPoint[field] = -10 + Math.random() * 20 // degrees
          break
        case "Y orintation":
          dataPoint[field] = -10 + Math.random() * 20 // degrees
          break
        case "compassHeading":
          dataPoint[field] = Math.random() * 360 // degrees
          break
        default:
          dataPoint[field] = Math.random() * 100
      }
    })

    data.push(dataPoint)
  }

  return data
}
