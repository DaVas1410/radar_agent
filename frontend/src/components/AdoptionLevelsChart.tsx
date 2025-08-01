"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, Legend, Tooltip, LabelList } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "./ui/chart"

interface RadarData {
  radar_data: Array<{
    quadrant: string;
    ring: string;
    [key: string]: any;
  }>;
}

interface AdoptionLevelsChartProps {
  radarData: RadarData | null;
}

const chartConfig = {
  techniques: {
    label: "TECHNIQUES",
    color: "#6182D9", // Blue - matches pie chart quadrant
  },
  tools: {
    label: "TOOLS", 
    color: "#6E824A", // Green - matches pie chart quadrant
  },
  platforms: {
    label: "PLATFORMS",
    color: "#E0DEDB", // Light gray/beige - matches pie chart quadrant
  },
  languagesframeworks: {
    label: "LANGUAGES & FRAMEWORKS",
    color: "#8F8F78", // Muted olive/gray - matches pie chart quadrant
  },
} satisfies ChartConfig

export function AdoptionLevelsChart({ radarData }: AdoptionLevelsChartProps) {
  const chartData = React.useMemo(() => {
    if (!radarData?.radar_data) return [];

    // Group by ring and count by quadrant
    const ringData = radarData.radar_data.reduce((acc, tech) => {
      const ring = tech.ring;
      // Normalize quadrant name to lowercase and remove spaces/special chars to match chartConfig keys
      const quadrant = tech.quadrant.toLowerCase().replace(/\s+/g, '').replace('&', '');
      
      if (!acc[ring]) {
        acc[ring] = { domain: ring, techniques: 0, tools: 0, platforms: 0, languagesframeworks: 0 };
      }
      
      // Ensure the quadrant key exists in our chartConfig
      if (quadrant === 'techniques' || quadrant === 'tools' || quadrant === 'platforms' || quadrant === 'languagesframeworks') {
        acc[ring][quadrant]++;
      }
      
      return acc;
    }, {} as Record<string, { domain: string; techniques: number; tools: number; platforms: number; languagesframeworks: number; }>);

    return Object.values(ringData);
  }, [radarData]);

  // Custom label function for bars to show counts when they're > 0
  const renderBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Only show label if value > 0 and bar is tall enough
    if (value === 0 || height < 20) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fontWeight="bold"
      >
        {value}
      </text>
    );
  };

  if (!radarData || chartData.length === 0) {
    return (
      <Card className="bg-black border-neutral-700 h-[600px]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Technology Distribution by Maturity</CardTitle>
          <CardDescription className="text-neutral-400">by Adoption Level</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center flex-1">
          <div className="text-neutral-500 text-base">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-neutral-700 h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-xl text-white">Technology Distribution by Maturity</CardTitle>
        <CardDescription className="text-neutral-400">by Adoption Level</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="h-[420px]">
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} stroke="#374151" />
            <XAxis
              dataKey="domain"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickFormatter={(value) => value.slice(0, 10)}
            />
            <Tooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            />
            <Legend content={<ChartLegendContent />} />
            <Bar
              dataKey="techniques"
              stackId="a"
              fill={chartConfig.techniques.color}
              radius={[0, 0, 4, 4]}
            >
              <LabelList content={renderBarLabel} />
            </Bar>
            <Bar
              dataKey="tools"
              stackId="a"
              fill={chartConfig.tools.color}
              radius={[0, 0, 0, 0]}
            >
              <LabelList content={renderBarLabel} />
            </Bar>
            <Bar
              dataKey="platforms"
              stackId="a"
              fill={chartConfig.platforms.color}
              radius={[0, 0, 0, 0]}
            >
              <LabelList content={renderBarLabel} />
            </Bar>
            <Bar
              dataKey="languagesframeworks"
              stackId="a"
              fill={chartConfig.languagesframeworks.color}
              radius={[4, 4, 0, 0]}
            >
              <LabelList content={renderBarLabel} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium text-white">
          Technology Domains by Maturity Level <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-neutral-400 leading-none text-xs">
          Distribution showing technology quadrants across adoption levels
        </div>
      </CardFooter>
    </Card>
  )
}
