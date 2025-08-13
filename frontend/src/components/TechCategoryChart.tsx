"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, Legend, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "./ui/chart"

interface RadarData {
  radar_data: Array<{
    quadrant: string;
    [key: string]: any;
  }>;
}

interface TechCategoryChartProps {
  radarData: RadarData | null;
}

const chartConfig = {
  count: {
    label: "TECHNOLOGIES",
  },
  techniques: {
    label: "TECHNIQUES",
    color: "#6182D9", // Blue - matches radar quadrant
  },
  tools: {
    label: "TOOLS", 
    color: "#6E824A", // Green - matches radar quadrant
  },
  platforms: {
    label: "PLATFORMS",
    color: "#E0DEDB", // Light gray/beige - matches radar quadrant
  },
  languagesframeworks: {
    label: "LANGUAGES & FRAMEWORKS",
    color: "#8F8F78", // Muted olive/gray - matches radar quadrant
  },
} satisfies ChartConfig

const getColorForCategory = (key: string): string => {
  const config = chartConfig[key as keyof typeof chartConfig];
  return config && 'color' in config ? config.color : "#6b7280";
};

export function TechCategoryChart({ radarData }: TechCategoryChartProps) {
  const chartData = React.useMemo(() => {
    if (!radarData?.radar_data) return [];

    const categoryCounts = radarData.radar_data.reduce((acc, tech) => {
      let quadrantKey = tech.quadrant.toLowerCase().replace(/\s+/g, "").replace("&", "");
      
      // Normalize the quadrant names to match our config keys
      if (quadrantKey.includes("language") || quadrantKey.includes("framework")) {
        quadrantKey = "languagesframeworks";
      }
      
      if (quadrantKey !== "count" && quadrantKey in chartConfig) {
        acc[quadrantKey] = (acc[quadrantKey] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([key, count]) => ({
      category: key,
      count,
      fill: getColorForCategory(key),
    }));
  }, [radarData]);

  const totalTechnologies = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData])

  // Custom label function to show percentage and count
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, count }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = ((count / totalTechnologies) * 100).toFixed(1);

    // Only show label if percentage is >= 5% to avoid cluttering
    if (parseFloat(percentage) < 5) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        <tspan x={x} dy="-6">{percentage}%</tspan>
        <tspan x={x} dy="14">({count})</tspan>
      </text>
    );
  };

  if (!radarData || chartData.length === 0) {
    return (
      <Card className="flex flex-col bg-black border-neutral-700 h-[600px]">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-xl text-white">Distribution by Quadrant</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-neutral-500 text-base">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col bg-black border-neutral-700 h-[600px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl text-white">Distribution by Quadrant</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[420px]"
          >
            <PieChart>
              <Tooltip 
                content={<ChartTooltipContent />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="category"
                innerRadius={80}
                strokeWidth={2}
                label={renderCustomLabel}
                labelLine={false}
              />
              <Legend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
          
          {/* Center text overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {totalTechnologies}
              </div>
              <div className="text-sm text-neutral-400 mt-1">
                Techs
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium text-white">
          Real-time Analysis <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-neutral-400 leading-none text-xs">
          Distribution across technology categories
        </div>
      </CardFooter>
    </Card>
  )
}
