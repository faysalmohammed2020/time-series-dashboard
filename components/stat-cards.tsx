"use client"

import { useMemo } from "react"
import { ArrowDownIcon, ArrowUpIcon, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardsProps {
  data: any[]
  numericColumns: string[]
}

export default function StatCards({ data, numericColumns }: StatCardsProps) {
  const stats = useMemo(() => {
    if (!data.length || !numericColumns.length) return []

    // Take up to 4 numeric columns
    const columnsToUse = numericColumns.slice(0, 4)

    return columnsToUse.map((column) => {
      // Calculate statistics for this column
      const values = data.map((item) => item[column]).filter((val) => typeof val === "number" && !isNaN(val))

      if (!values.length) {
        return {
          name: column,
          value: "N/A",
          change: 0,
          trend: "neutral",
        }
      }

      const sum = values.reduce((acc, val) => acc + val, 0)
      const avg = sum / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)

      // Calculate trend (using first half vs second half of data)
      const midpoint = Math.floor(values.length / 2)
      const firstHalf = values.slice(0, midpoint)
      const secondHalf = values.slice(midpoint)

      const firstHalfAvg = firstHalf.reduce((acc, val) => acc + val, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((acc, val) => acc + val, 0) / secondHalf.length

      const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral"

      return {
        name: column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " "),
        value: avg.toFixed(2),
        max: max.toFixed(2),
        min: min.toFixed(2),
        change: Math.abs(change).toFixed(1),
        trend,
      }
    })
  }, [data, numericColumns])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
            {stat.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : stat.trend === "down" ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              Range: {stat.min} - {stat.max}
            </p>
            <div className="mt-2 flex items-center text-xs">
              {stat.trend === "up" ? (
                <>
                  <ArrowUpIcon className="mr-1 h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500">{stat.change}% increase</span>
                </>
              ) : stat.trend === "down" ? (
                <>
                  <ArrowDownIcon className="mr-1 h-4 w-4 text-rose-500" />
                  <span className="text-rose-500">{stat.change}% decrease</span>
                </>
              ) : (
                <span className="text-muted-foreground">No change</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
