"use client"

import { useMemo, useState } from "react"
import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  CartesianGrid,
  XAxis,
  YAxis,
  ZAxis,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface ScatterPlotProps {
  data: any[]
  xColumn: string
  yColumn: string
  title?: string
}

export default function ScatterPlot({ data, xColumn, yColumn, title }: ScatterPlotProps) {
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Format data for the scatter plot
  const chartData = useMemo(() => {
    // Ensure we have data and columns
    if (!data || data.length === 0 || !xColumn || !yColumn) {
      console.warn("Missing data or columns for ScatterPlot")
      return []
    }

    console.log("ScatterPlot data sample:", data.slice(0, 3))
    console.log("ScatterPlot columns:", { xColumn, yColumn })

    return data.map((item) => {
      // Ensure x and y values are numeric
      let xValue = item[xColumn]
      let yValue = item[yColumn]

      if (typeof xValue !== "number") {
        if (xValue && typeof xValue === "string") {
          const numValue = Number(xValue)
          xValue = isNaN(numValue) ? 0 : numValue
        } else {
          xValue = 0
        }
      }

      if (typeof yValue !== "number") {
        if (yValue && typeof yValue === "string") {
          const numValue = Number(yValue)
          yValue = isNaN(numValue) ? 0 : numValue
        } else {
          yValue = 0
        }
      }

      return {
        x: xValue,
        y: yValue,
        z: 1, // Size of the dot
        name: `${xColumn}: ${xValue}, ${yColumn}: ${yValue}`,
        _original: item, // Store the original data item
      }
    })
  }, [data, xColumn, yColumn])

  // Create a config object for the chart container
  const chartConfig = useMemo(() => {
    return {
      scatter: {
        label: "Data Points",
        color: "hsl(var(--chart-3))",
      },
    }
  }, [])

  // Generate a title based on the columns if not provided
  const chartTitle =
    title ||
    `${xColumn.charAt(0).toUpperCase() + xColumn.slice(1).replace(/_/g, " ")} vs ${
      yColumn.charAt(0).toUpperCase() + yColumn.slice(1).replace(/_/g, " ")
    }`

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

  // Handle click on a data point
  const handleClick = (data: any) => {
    setSelectedPoint(data)
    setShowDetails(true)
  }

  // If we have no data, show a placeholder
  if (chartData.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to generate scatter plot</CardDescription>
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
            Correlation between {xColumn.replace(/_/g, " ")} and {yColumn.replace(/_/g, " ")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsScatterChart
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      handleClick(data.activePayload[0].payload)
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={xColumn}
                    label={{
                      value: `${xColumn.replace(/_/g, " ")} ${getFieldUnit(xColumn)}`,
                      position: "insideBottom",
                      offset: -10,
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={yColumn}
                    label={{
                      value: `${yColumn.replace(/_/g, " ")} ${getFieldUnit(yColumn)}`,
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <ZAxis type="number" dataKey="z" range={[50, 500]} />
                  <ChartTooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => `Data Point`}
                        formatter={(value, name) => {
                          if (name === "x") return [`${value} ${getFieldUnit(xColumn)}`, xColumn.replace(/_/g, " ")]
                          if (name === "y") return [`${value} ${getFieldUnit(yColumn)}`, yColumn.replace(/_/g, " ")]
                          return [value, name]
                        }}
                      />
                    }
                  />
                  <Scatter name="Data Points" data={chartData} fill="var(--color-scatter)" isAnimationActive={true} />
                </RechartsScatterChart>
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
              Detailed information about the selected data point and correlation statistics
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
                        <TableCell>{xColumn}</TableCell>
                        <TableCell>{selectedPoint.x}</TableCell>
                        <TableCell>{getFieldUnit(xColumn)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{yColumn}</TableCell>
                        <TableCell>{selectedPoint.y}</TableCell>
                        <TableCell>{getFieldUnit(yColumn)}</TableCell>
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
                        <TableHead>Field</TableHead>
                        <TableHead>Min</TableHead>
                        <TableHead>Max</TableHead>
                        <TableHead>Average</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>{xColumn}</TableCell>
                        <TableCell>
                          {Math.min(...chartData.map((item) => item.x)).toFixed(2)} {getFieldUnit(xColumn)}
                        </TableCell>
                        <TableCell>
                          {Math.max(...chartData.map((item) => item.x)).toFixed(2)} {getFieldUnit(xColumn)}
                        </TableCell>
                        <TableCell>
                          {(chartData.reduce((sum, item) => sum + item.x, 0) / chartData.length).toFixed(2)}{" "}
                          {getFieldUnit(xColumn)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{yColumn}</TableCell>
                        <TableCell>
                          {Math.min(...chartData.map((item) => item.y)).toFixed(2)} {getFieldUnit(yColumn)}
                        </TableCell>
                        <TableCell>
                          {Math.max(...chartData.map((item) => item.y)).toFixed(2)} {getFieldUnit(yColumn)}
                        </TableCell>
                        <TableCell>
                          {(chartData.reduce((sum, item) => sum + item.y, 0) / chartData.length).toFixed(2)}{" "}
                          {getFieldUnit(yColumn)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Correlation Analysis</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Correlation coefficient: {calculateCorrelation(chartData).toFixed(4)}
                </p>
                <p className="text-sm text-muted-foreground">{interpretCorrelation(calculateCorrelation(chartData))}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(data: any[]): number {
  if (!data || data.length < 2) return 0

  const n = data.length
  const xValues = data.map((item) => item.x)
  const yValues = data.map((item) => item.y)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXSquare = xValues.reduce((sum, x) => sum + x * x, 0)
  const sumYSquare = yValues.reduce((sum, y) => sum + y * y, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumXSquare - sumX * sumX) * (n * sumYSquare - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

// Interpret correlation coefficient
function interpretCorrelation(correlation: number): string {
  const absCorr = Math.abs(correlation)
  if (absCorr > 0.9) {
    return `Very strong ${correlation > 0 ? "positive" : "negative"} correlation`
  } else if (absCorr > 0.7) {
    return `Strong ${correlation > 0 ? "positive" : "negative"} correlation`
  } else if (absCorr > 0.5) {
    return `Moderate ${correlation > 0 ? "positive" : "negative"} correlation`
  } else if (absCorr > 0.3) {
    return `Weak ${correlation > 0 ? "positive" : "negative"} correlation`
  } else {
    return "Little to no correlation"
  }
}
