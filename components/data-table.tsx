"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps {
  data: any[]
}

export default function DataTable({ data }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Get column headers
  const columns = data.length > 0 ? Object.keys(data[0]) : []

  // Filter data based on search term
  const filteredData = data.filter((row) => {
    return columns.some((column) => {
      const value = row[column]
      if (value === null || value === undefined) return false

      if (value instanceof Date) {
        return value.toISOString().toLowerCase().includes(searchTerm.toLowerCase())
      }

      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  // Format cell value for display
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return "-"

    if (value instanceof Date) {
      return value.toLocaleString()
    }

    if (typeof value === "number") {
      return value.toLocaleString()
    }

    return String(value)
  }

  // Get cell class based on value type
  const getCellClass = (value: any) => {
    if (value === null || value === undefined) return "text-muted-foreground"

    if (typeof value === "number") {
      return "font-medium text-emerald-600 dark:text-emerald-400"
    }

    if (value instanceof Date) {
      return "text-blue-600 dark:text-blue-400"
    }

    return ""
  }

  // Handle CSV export
  const exportToCSV = () => {
    const headers = columns.join(",")
    const rows = filteredData
      .map((row) => {
        return columns
          .map((column) => {
            const value = row[column]
            if (value === null || value === undefined) return ""

            if (value instanceof Date) {
              return value.toISOString()
            }

            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }

            return String(value)
          })
          .join(",")
      })
      .join("\n")

    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "time_series_data.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Table</CardTitle>
            <CardDescription>Raw data from the time series dataset ({data.length} rows)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
            className="h-9"
          />
          <Button variant="ghost" size="sm" className="h-9 px-2">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>
                    {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " ")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column}`} className={getCellClass(row[column])}>
                        {formatCellValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
