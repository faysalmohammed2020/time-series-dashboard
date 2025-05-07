"use client"

import { useMemo, useState } from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface TimeSeriesChartProps {
  data: any[]
  timeColumn: string
  dataColumns: string[]
  chartType?: "line" | "area"
  title?: string
}

export default function TimeSeriesChart({
  data,
  timeColumn,
  dataColumns,
  chartType = "line",
  title,
}: TimeSeriesChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Format data for the chart
  const chartData = useMemo(() => {
    // Ensure we have data and columns
    if (!data || data.length === 0 || !dataColumns || dataColumns.length === 0) {
      console.warn("Missing data or columns for TimeSeriesChart")
      return []
    }

    return data.map((item) => {
      const formattedItem: any = {}

      // Format the time column
      if (item[timeColumn] instanceof Date) {
        formattedItem[timeColumn] = item[timeColumn].toISOString()
      } else {
        formattedItem[timeColumn] = item[timeColumn]
      }

      // Add the data columns, ensuring they're numeric
      dataColumns.forEach((col) => {
        // If the value is not a number, try to convert it
        if (typeof item[col] !== "number") {
          if (item[col] && typeof item[col] === "string") {
            const numValue = Number(item[col])
            formattedItem[col] = isNaN(numValue) ? 0 : numValue
          } else {
            formattedItem[col] = 0
          }
        } else {
          formattedItem[col] = item[col]
        }
      })

      // Store the original data item for reference
      formattedItem._original = item

      return formattedItem
    })
  }, [data, timeColumn, dataColumns])

  // Create a config object for the chart container
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}

    // Generate colors for each data column
    const colors = [
      "hsl(215, 100%, 50%)", // Blue
      "hsl(142, 76%, 36%)", // Green
      "hsl(355, 78%, 56%)", // Red
      "hsl(31, 100%, 60%)", // Orange
      "hsl(262, 83%, 58%)", // Purple
    ]

    dataColumns.forEach((col, index) => {
      config[col] = {
        label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "),
        color: colors[index % colors.length],
      }
    })

    return config
  }, [dataColumns])

  // Generate a title based on the data columns if not provided
  const chartTitle =
    title ||
    `${dataColumns.map((col) => col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " ")).join(", ")} Over Time`

  // Get units for the field (for display purposes)
  const getFieldUnit = (field: string): string => {
    const fieldLower = field.toLowerCase()

    if (fieldLower.includes("temp")) return "°C"
    if (fieldLower.includes("solar")) return "W/m²"
    if (fieldLower.includes("precipitation")) return "mm"
    if (fieldLower.includes("distance")) return "km"
    if (fieldLower.includes("wind") && !fieldLower.includes("direction")) return "m/s"
    if (fieldLower.includes("direction") || fieldLower.includes("heading") || fieldLower.includes("orintation"))
      return "°"
    if (fieldLower.includes("pressure")) return "hPa"
    if (fieldLower.includes("humidity")) return "%"

    return ""
  }

  // Get a description for the chart
  const getChartDescription = (field: string): string => {
    const unit = getFieldUnit(field)
    return `Time series data ${unit ? `(${unit})` : ""}`
  }

  // Handle click on a data point
  const handleClick = (data: any, index: number) => {
    setSelectedPoint(data)
    setShowDetails(true)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString()
    } catch (e) {
      return dateStr
    }
  }

  // If we have no data or columns, show a placeholder
  if (chartData.length === 0 || dataColumns.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to generate time series chart</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No numeric data available for visualization</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
          <CardDescription>
            {dataColumns.length === 1
              ? getChartDescription(dataColumns[0])
              : `Time series visualization of ${dataColumns.length} metrics`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }} onClick={handleClick}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={timeColumn}
                    tickFormatter={(value) => {
                      if (typeof value === "string" && (value.includes("T") || value.includes("-"))) {
                        try {
                          const date = new Date(value)
                          return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                          })
                        } catch (e) {
                          return value
                        }
                      }
                      return value
                    }}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={
                      dataColumns.length === 1
                        ? {
                            value: `${dataColumns[0]} ${getFieldUnit(dataColumns[0])}`,
                            angle: -90,
                            position: "insideLeft",
                            style: { textAnchor: "middle" },
                          }
                        : undefined
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          if (typeof value === "string" && (value.includes("T") || value.includes("-"))) {
                            try {
                              const date = new Date(value)
                              return date.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            } catch (e) {
                              return value
                            }
                          }
                          return value
                        }}
                        formatter={(value, name, props) => {
                          const unit = getFieldUnit(name as string)
                          return [`${value} ${unit}`, name]
                        }}
                      />
                    }
                  />
                  {dataColumns.map((column, index) => (
                    <Line
                      key={column}
                      type="monotone"
                      dataKey={column}
                      stroke={chartConfig[column].color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, onClick: (data, index) => handleClick(data.payload, index) }}
                      isAnimationActive={true}
                      name={column}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="p-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPoint(chartData[0])
                setShowDetails(true)
              }}
            >
              <Info className="mr-2 h-4 w-4" />
              View Data Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{chartTitle} - Data Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected data point and related statistics
            </DialogDescription>
          </DialogHeader>

          {selectedPoint && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Selected Data Point</h3>
                <div className="rounded-md border overflow-x-auto mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>{formatDate(selectedPoint[timeColumn])}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                      {dataColumns.map((column) => (
                        <TableRow key={column}>
                          <TableCell>{column}</TableCell>
                          <TableCell>{selectedPoint[column]}</TableCell>
                          <TableCell>{getFieldUnit(column)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Statistics</h3>
                <div className="rounded-md border overflow-x-auto mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataColumns.map((column) => {
                        const values = chartData.map((item) => item[column]).filter((val) => !isNaN(val))
                        const min = Math.min(...values)
                        const max = Math.max(...values)
                        const avg = values.reduce((sum, val) => sum + val, 0) / values.length

                        return (
                          <TableRow key={column}>
                            <TableCell>{column}</TableCell>
                            <TableCell>
                              {min.toFixed(2)} {getFieldUnit(column)}
                            </TableCell>
                            <TableCell>
                              {max.toFixed(2)} {getFieldUnit(column)}
                            </TableCell>
                            <TableCell>
                              {avg.toFixed(2)} {getFieldUnit(column)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
