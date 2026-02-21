import { useState, useEffect } from 'react';
import { fetchIndustryStats } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface IndustryRow {
  industry: string;
  avgCO2: number;
  siteCount: number;
  greenPercent: number;
}

interface TooltipPayload {
  payload: IndustryRow;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-semibold mb-1">{d.industry}</p>
      <p className="text-muted-foreground">Avg CO2: <span className="text-foreground font-medium">{d.avgCO2.toFixed(3)} g</span></p>
      <p className="text-muted-foreground">Sites: <span className="text-foreground font-medium">{d.siteCount.toLocaleString()}</span></p>
      <p className="text-muted-foreground">Green hosted: <span className="text-foreground font-medium">{d.greenPercent.toFixed(1)}%</span></p>
    </div>
  );
}

export function IndustryBreakdown() {
  const [industries, setIndustries] = useState<IndustryRow[]>([]);
  const [overallAvg, setOverallAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndustryStats()
      .then((data) => {
        setIndustries(data.industries ?? []);
        setOverallAvg(data.overallAvgCO2 ?? 0);
      })
      .catch((e) => console.error('Failed to load industry stats:', e))
      .finally(() => setLoading(false));
  }, []);

  // Chart height scales with the number of industries (min 300px).
  const chartHeight = Math.max(300, industries.length * 40);

  return (
    <section id="industry-breakdown" className="container py-8 md:py-12 lg:py-12">
      <div className="mx-auto flex flex-col items-center space-y-4 text-center pb-8">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          By Industry
        </h2>
        <p className="max-w-[85%] lg:max-w-[55%] leading-normal text-muted-foreground sm:text-lg sm:leading-7 balance-text">
          Average CO2 per page view grouped by industry. Dashed line marks the
          overall average. Hover a bar for site count and green-hosting rate.
        </p>
      </div>

      <div className="mx-auto max-w-[64rem] rounded-lg border bg-background p-4">
        {loading ? (
          <Skeleton className="rounded-lg" style={{ height: `${chartHeight}px` }} />
        ) : industries.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No industry data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              layout="vertical"
              data={industries}
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v.toFixed(2)}g`}
                domain={[0, 'dataMax + 0.05']}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="industry"
                width={130}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <ReferenceLine
                x={overallAvg}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 3"
                label={{ value: 'avg', position: 'top', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Bar dataKey="avgCO2" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {industries.map((entry) => (
                  <Cell
                    key={entry.industry}
                    fill={entry.avgCO2 <= overallAvg ? '#10b981' : '#f59e0b'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
