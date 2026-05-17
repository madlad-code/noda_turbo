// FILE: apps/web/components/views/overview/WeatherTrendSimpleChart.tsx
// NEW FILE: A simpler, more reliable chart based on the user's selection.
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { format, isValid } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Define the shape of the incoming data points from your API
type WeatherDataPoint = {
  time_period: string;
  outdoor_temperature: number | null;
}

// Define the props for our component
interface WeatherTrendSimpleChartProps {
  data: WeatherDataPoint[];
}

// Define the chart's configuration
const chartConfig = {
  temperature: {
    label: "Temperature",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function WeatherTrendSimpleChart({ data }: WeatherTrendSimpleChartProps) {
  // Process the incoming data to fit the chart's expected format
  const chartData = React.useMemo(() => {
    return data
      .map(item => {
        const date = new Date(Number(item.time_period))
        if (!isValid(date) || item.outdoor_temperature === null) {
          return null
        }
        return {
          // Format the date for the x-axis label, e.g., "Apr 6"
          date: format(date, "MMM d"),
          temperature: item.outdoor_temperature,
        }
      })
      .filter((item): item is { date: string; temperature: number } => item !== null)
      .slice(-30); // Show up to the last 30 data points
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temperature Trend</CardTitle>
        <CardDescription>
          Showing recent outdoor temperature readings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="temperature"
              type="natural"
              fill="var(--color-chart-5)"
              fillOpacity={0.4}
              stroke="var(--color-chart-5)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}