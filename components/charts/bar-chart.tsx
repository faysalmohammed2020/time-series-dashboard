"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface BarChartProps {
  data: any[]
  timeColumn: string
  dataColumn: string
  title?: string
}

export default function BarChart({ data, timeColumn, dataColumn, title }: BarChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Aggregate data by time periods (e.g., by day, month)
  const chartData = useMemo(() => {
    // Ensure we have data and columns
    if (!data || data.length === 0 || !dataColumn) {
      console.warn("Missing data or columns for BarChart")
      return []
    }

    console.log("BarChart data sample:", data.slice(0, 3))
    console.log("BarChart columns:", { timeColumn, dataColumn })

    // Group data by time periods
    const groupedData: Record<string, number> = {}
    const originalData: Record<string, any[]> = {}

    data.forEach((item) => {
      let timeKey

      if (item[timeColumn] instanceof Date) {
        // Format date to YYYY-MM-DD
        timeKey = item[timeColumn].toISOString().split("T")[0]
      } else if (typeof item[timeColumn] === "string" && item[timeColumn].includes("T")) {
        // Handle ISO string
        timeKey = item[timeColumn].split("T")[0]
      } else {
        timeKey = String(item[timeColumn])
      }

      if (!groupedData[timeKey]) {
        groupedData[timeKey] = 0
        originalData[timeKey] = []
      }

      // Ensure the value is numeric
      let value = item[dataColumn]
      if (typeof value !== "number") {
        if (value && typeof value === "string") {
          const numValue = Number(value)
          value = isNaN(numValue) ? 0 : numValue
        } else {
          value = 0
        }
      }

      groupedData[timeKey] += value
      originalData[timeKey].push(item)
    })

    // Convert to array format for Recharts
    return Object.entries(groupedData).map(([time, value]) => ({
      [timeColumn]: time,
      [dataColumn]: value,
      _originalData: originalData[time],
    }))
  }, [data, timeColumn, dataColumn])

  // Create a config object for the chart container
  const chartConfig = useMemo(() => {
    return {
      [dataColumn]: {
        label: dataColumn.charAt(0).toUpperCase() + dataColumn.slice(1).replace(/_/g, " "),
        color: "hsl(var(--chart-1))",
      },
    }
  }, [dataColumn])

  // Generate a title based on the data column if not provided
  const chartTitle =
    title || `${dataColumn.charAt(0).toUpperCase() + dataColumn.slice(1).replace(/_/g, " ")} by Time Period`

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

  // Handle click on a bar
  const handleClick = (data: any) => {
    setSelectedPoint(data)
    setShowDetails(true)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch (e) {
      return dateStr
    }
  }

  // If we have no data, show a placeholder
  if (chartData.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to generate bar chart</CardDescription>
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
          <CardDescription>Aggregated values over time periods</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  onClick={handleClick}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={timeColumn}
                    tickFormatter={(value) => {
                      if (typeof value === "string" && value.includes("-")) {
                        try {
                          const date = new Date(value)
                          return date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
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
                    label={{
                      value: `${dataColumn} ${getFieldUnit(dataColumn)}`,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          if (typeof value === "string" && value.includes("-")) {
                            try {
                              const date = new Date(value)
                              return date.toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            } catch (e) {
                              return value
                            }
                          }
                          return value
                        }}
                        formatter={(value, name) => [`${value} ${getFieldUnit(name as string)}`, name]}
                      />
                    }
                  />
                  <Bar
                    dataKey={dataColumn}
                    fill={`var(--color-${dataColumn})`}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                  />
                </RechartsBarChart>
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
            <DialogDescription>Detailed information about the selected time period</DialogDescription>
          </DialogHeader>

          {selectedPoint && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Selected Time Period</h3>
                <div className="rounded-md border overflow-x-auto mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total {dataColumn}</TableHead>
                        <TableHead>Data Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{formatDate(selectedPoint[timeColumn])}</TableCell>
                        <TableCell>
                          {selectedPoint[dataColumn]} {getFieldUnit(dataColumn)}
                        </TableCell>
                        <TableCell>{selectedPoint._originalData ? selectedPoint._originalData.length : 0}</TableCell>
                      </TableRow>
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
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPoint._originalData && (
                        <>
                          <TableRow>
                            <TableCell>Minimum</TableCell>
                            <TableCell>
                              {Math.min(...selectedPoint._originalData.map((item: any) => item[dataColumn])).toFixed(2)}{" "}
                              {getFieldUnit(dataColumn)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Maximum</TableCell>
                            <TableCell>
                              {Math.max(...selectedPoint._originalData.map((item: any) => item[dataColumn])).toFixed(2)}{" "}
                              {getFieldUnit(dataColumn)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Average</TableCell>
                            <TableCell>
                              {(
                                selectedPoint._originalData.reduce(
                                  (sum: number, item: any) => sum + item[dataColumn],
                                  0,
                                ) / selectedPoint._originalData.length
                              ).toFixed(2)}{" "}
                              {getFieldUnit(dataColumn)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedPoint._originalData && selectedPoint._originalData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium">Individual Data Points</h3>
                  <div className="rounded-md border overflow-x-auto mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>{dataColumn}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPoint._originalData.slice(0, 10).map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {item[timeColumn] instanceof Date
                                ? item[timeColumn].toLocaleString()
                                : typeof item[timeColumn] === "string" && item[timeColumn].includes("T")
                                  ? new Date(item[timeColumn]).toLocaleString()
                                  : item[timeColumn]}
                            </TableCell>
                            <TableCell>
                              {item[dataColumn]} {getFieldUnit(dataColumn)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {selectedPoint._originalData.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              Showing 10 of {selectedPoint._originalData.length} data points
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
