"use server"

import { exec } from "child_process"
import { promises as fs } from "fs"
import path from "path"
import { revalidatePath } from "next/cache"

// Server action to convert CSV to JSON
export async function convertCsvToJson() {
  try {
    // Execute the conversion script
    return new Promise((resolve, reject) => {
      exec("node scripts/convert-csv-to-json.js", (error, stdout, stderr) => {
        if (error) {
          console.error(`Execution error: ${error.message}`)
          return reject(new Error(`Failed to convert CSV: ${error.message}`))
        }

        if (stderr) {
          console.error(`Script error: ${stderr}`)
        }

        console.log(`Script output: ${stdout}`)

        // Revalidate the dashboard path to refresh the data
        revalidatePath("/")

        resolve({ success: true, message: "CSV data converted to JSON successfully" })
      })
    })
  } catch (error) {
    console.error("Error in convertCsvToJson action:", error)
    return { success: false, message: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}

// Server action to check if JSON data exists
export async function checkJsonDataExists() {
  try {
    const dataPath = path.join(process.cwd(), "public", "data", "time-series-data.json")

    try {
      await fs.access(dataPath)
      return { exists: true }
    } catch {
      return { exists: false }
    }
  } catch (error) {
    console.error("Error checking if JSON data exists:", error)
    return { exists: false, error: error instanceof Error ? error.message : "Unknown error occurred" }
  }
}
