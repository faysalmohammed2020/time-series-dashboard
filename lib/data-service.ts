import Papa from "papaparse"

// Function to fetch and parse CSV data directly in the browser
export async function fetchAndParseCSV(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("CSV text sample:", csvText.substring(0, 500)) // Log a sample of the CSV

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // This should convert numeric strings to numbers
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error("No data found in CSV file"))
            return
          }

          console.log("CSV parsing results:", results)
          console.log("Sample data row:", results.data[0])

          // Force convert all potential numeric values to numbers
          const processedData = forceNumericConversion(results.data as any[])
          console.log("Processed data sample:", processedData[0])

          resolve(processedData)
        },
        error: (error) => {
          reject(new Error(`Error parsing CSV: ${error.message}`))
        },
      })
    })
  } catch (error) {
    console.error("Error fetching CSV data:", error)
    throw error
  }
}

// Function to aggressively convert string values to numbers
export function forceNumericConversion(data: any[]) {
  if (!data || data.length === 0) return data

  // First, identify potential numeric columns by checking all rows
  const potentialNumericColumns = new Set<string>()

  // Weather-related fields that should be numeric
  const weatherFields = [
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

  // Check each column in each row
  data.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      // Skip obvious non-numeric columns
      if (
        key.toLowerCase().includes("time") ||
        key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("name") ||
        key.toLowerCase().includes("id")
      ) {
        return
      }

      // Check if this is a weather field or could be numeric
      const isWeatherField = weatherFields.some(
        (field) =>
          key.toLowerCase().includes(field.toLowerCase()) ||
          key.toLowerCase().replace(/[_\s]/g, "") === field.toLowerCase().replace(/[_\s]/g, ""),
      )

      if (isWeatherField) {
        potentialNumericColumns.add(key)
      } else if (typeof value === "string") {
        const trimmed = value.trim()
        // Try to convert to number
        if (trimmed !== "" && !isNaN(Number(trimmed))) {
          potentialNumericColumns.add(key)
        }
      } else if (typeof value === "number") {
        potentialNumericColumns.add(key)
      }
    })
  })

  console.log("Potential numeric columns:", Array.from(potentialNumericColumns))

  // Now convert all values in potential numeric columns to numbers
  return data.map((row) => {
    const newRow = { ...row }

    potentialNumericColumns.forEach((column) => {
      if (column in newRow) {
        const value = newRow[column]
        if (typeof value === "string") {
          const trimmed = value.trim()
          if (trimmed !== "") {
            const numValue = Number(trimmed)
            if (!isNaN(numValue)) {
              newRow[column] = numValue
            }
          }
        }
      }
    })

    return newRow
  })
}

// Function to get numeric columns from the data
export function getNumericColumns(data: any[]): string[] {
  if (!data || data.length === 0) return []

  // Weather-related fields that should be numeric
  const weatherFields = [
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

  // First, check the first row to get initial numeric columns
  const firstRow = data[0]
  let numericColumns = Object.keys(firstRow).filter((key) => {
    return typeof firstRow[key] === "number"
  })

  console.log("Initial numeric columns from first row:", numericColumns)

  // If no numeric columns found, check more rows
  if (numericColumns.length === 0) {
    // Try to find any numeric values in the first 10 rows
    const columnsToCheck = Object.keys(firstRow)
    const numericColumnSet = new Set<string>()

    // Check up to 10 rows or all rows if less than 10
    const rowsToCheck = Math.min(10, data.length)

    for (let i = 0; i < rowsToCheck; i++) {
      const row = data[i]
      columnsToCheck.forEach((column) => {
        if (typeof row[column] === "number") {
          numericColumnSet.add(column)
        }
      })
    }

    numericColumns = Array.from(numericColumnSet)
    console.log("Numeric columns from checking multiple rows:", numericColumns)
  }

  // Check for weather fields specifically
  const weatherNumericColumns = Object.keys(firstRow).filter((key) =>
    weatherFields.some(
      (field) =>
        key.toLowerCase().includes(field.toLowerCase()) ||
        key.toLowerCase().replace(/[_\s]/g, "") === field.toLowerCase().replace(/[_\s]/g, ""),
    ),
  )

  console.log("Weather-related columns:", weatherNumericColumns)

  // Combine numeric columns and weather columns
  const combinedColumns = [...new Set([...numericColumns, ...weatherNumericColumns])]

  // If still no columns, force some columns to be treated as numeric
  if (combinedColumns.length === 0) {
    // Get all columns except obvious non-numeric ones
    const forcedColumns = Object.keys(firstRow).filter((key) => {
      return (
        !key.toLowerCase().includes("time") &&
        !key.toLowerCase().includes("date") &&
        !key.toLowerCase().includes("name") &&
        !key.toLowerCase().includes("id")
      )
    })

    console.log("Forced numeric columns:", forcedColumns)
    return forcedColumns
  }

  return combinedColumns
}

// Function to get time/date columns from the data
export function getTimeColumns(data: any[]): string[] {
  if (!data || data.length === 0) return []

  const firstRow = data[0]
  const timeColumns = Object.keys(firstRow).filter(
    (key) =>
      key.toLowerCase().includes("time") ||
      key.toLowerCase().includes("date") ||
      key.toLowerCase().includes("timestamp") ||
      firstRow[key] instanceof Date,
  )

  // If no time columns found, try to use the first column as a fallback
  if (timeColumns.length === 0 && Object.keys(firstRow).length > 0) {
    return [Object.keys(firstRow)[0]]
  }

  return timeColumns
}

// Function to save data to localStorage
export function saveDataToLocalStorage(data: any[]) {
  try {
    // Convert Date objects to ISO strings for storage
    const serializedData = data.map((item) => {
      const serializedItem = { ...item }
      Object.keys(serializedItem).forEach((key) => {
        if (serializedItem[key] instanceof Date) {
          serializedItem[key] = serializedItem[key].toISOString()
        }
      })
      return serializedItem
    })

    localStorage.setItem("timeSeriesData", JSON.stringify(serializedData))
    localStorage.setItem("timeSeriesDataTimestamp", new Date().toISOString())
    return true
  } catch (error) {
    console.error("Error saving data to localStorage:", error)
    return false
  }
}

// Function to load data from localStorage
export function loadDataFromLocalStorage() {
  try {
    const serializedData = localStorage.getItem("timeSeriesData")
    if (!serializedData) return null

    const data = JSON.parse(serializedData)

    // Convert ISO strings back to Date objects
    const deserializedData = data.map((item: any) => {
      const deserializedItem = { ...item }
      Object.keys(deserializedItem).forEach((key) => {
        if (
          typeof deserializedItem[key] === "string" &&
          (key.toLowerCase().includes("time") || key.toLowerCase().includes("date"))
        ) {
          try {
            const date = new Date(deserializedItem[key])
            if (!isNaN(date.getTime())) {
              deserializedItem[key] = date
            }
          } catch (e) {
            // Keep as string if conversion fails
          }
        }
      })
      return deserializedItem
    })

    // Force convert numeric values
    return forceNumericConversion(deserializedData)
  } catch (error) {
    console.error("Error loading data from localStorage:", error)
    return null
  }
}

// Function to check if cached data is still fresh (less than 1 hour old)
export function isCachedDataFresh() {
  try {
    const timestamp = localStorage.getItem("timeSeriesDataTimestamp")
    if (!timestamp) return false

    const cachedTime = new Date(timestamp).getTime()
    const currentTime = new Date().getTime()
    const oneHour = 60 * 60 * 1000 // 1 hour in milliseconds

    return currentTime - cachedTime < oneHour
  } catch (error) {
    return false
  }
}

// Function to get column types from data
export function getColumnTypes(data: any[]) {
  if (!data || data.length === 0) return {}

  const firstRow = data[0]
  const types: Record<string, string> = {}

  Object.keys(firstRow).forEach((key) => {
    const value = firstRow[key]
    if (typeof value === "number") {
      types[key] = "number"
    } else if (value instanceof Date) {
      types[key] = "date"
    } else {
      types[key] = typeof value
    }
  })

  return types
}

// Function to generate sample data if needed
export function generateSampleData() {
  const data = []
  const now = new Date()

  for (let i = 0; i < 100; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000) // Go back i days

    data.push({
      timestamp: date,
      value1: Math.random() * 100,
      value2: Math.random() * 50,
      value3: Math.random() * 200,
    })
  }

  return data
}
