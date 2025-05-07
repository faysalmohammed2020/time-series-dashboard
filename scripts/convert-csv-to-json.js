import fs from "fs"
import path from "path"
import Papa from "papaparse"
import fetch from "node-fetch"

// This script fetches the CSV file and converts it to JSON
async function convertCsvToJson() {
  try {
    console.log("Fetching CSV data...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ML-417ADS_125416523_3-FsSETybgez6hFyBBY5nnjA1Ex50wn6.csv",
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log("CSV data fetched successfully")

    // Parse CSV to JSON
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          console.error("No data found in CSV file")
          return
        }

        // Process the data to ensure dates are properly formatted
        const processedData = results.data.map((row) => {
          // Find time/date columns
          const timeKeys = Object.keys(row).filter(
            (key) => key.toLowerCase().includes("time") || key.toLowerCase().includes("date"),
          )

          // Convert string dates to ISO strings for easy parsing later
          if (timeKeys.length > 0) {
            timeKeys.forEach((timeKey) => {
              if (row[timeKey] && typeof row[timeKey] === "string") {
                try {
                  const date = new Date(row[timeKey])
                  if (!isNaN(date.getTime())) {
                    row[timeKey] = date.toISOString()
                  }
                } catch (e) {
                  // Keep original if date parsing fails
                }
              }
            })
          }

          return row
        })

        // Create data directory if it doesn't exist
        const dataDir = path.join(process.cwd(), "public", "data")
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }

        // Write to JSON file
        const jsonFilePath = path.join(dataDir, "time-series-data.json")
        fs.writeFileSync(jsonFilePath, JSON.stringify(processedData, null, 2))

        console.log(`JSON data saved to ${jsonFilePath}`)

        // Also create a metadata file with column information
        if (processedData.length > 0) {
          const firstRow = processedData[0]
          const columns = Object.keys(firstRow)

          // Determine column types
          const columnTypes = {}
          columns.forEach((col) => {
            const value = firstRow[col]
            if (typeof value === "number") {
              columnTypes[col] = "number"
            } else if (
              typeof value === "string" &&
              (col.toLowerCase().includes("time") || col.toLowerCase().includes("date"))
            ) {
              columnTypes[col] = "date"
            } else {
              columnTypes[col] = typeof value
            }
          })

          const metadata = {
            totalRows: processedData.length,
            columns: columnTypes,
            lastUpdated: new Date().toISOString(),
          }

          const metadataFilePath = path.join(dataDir, "time-series-metadata.json")
          fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2))
          console.log(`Metadata saved to ${metadataFilePath}`)
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error.message)
      },
    })
  } catch (err) {
    console.error("Error in conversion process:", err)
  }
}

convertCsvToJson()
