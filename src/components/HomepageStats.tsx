import { useState, useEffect } from 'react';
import { fetchStats, fetchTrend } from '@/lib/api';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChartWrapper } from '@/components/ui/wrapper';

interface StatsData {
  totalActiveSites: number;
  totalIndexesRun: number;
  averageCO2Grams: number;
  greenHostedPercent: number;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}MM+`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k+`;
  return String(num);
}

export function HomepageStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [trendData, setTrendData] = useState<
    { date: string; name: string; co2: number; industryAverageCo2: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Time since midnight EST — computed once on mount
  const now = new Date();
  const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const midnight = new Date(estNow);
  midnight.setHours(0, 0, 0, 0);
  const diffHours = Math.floor((Number(now) - Number(midnight)) / 3_600_000);
  const timeSinceMidnight = `~${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  useEffect(() => {
    async function load() {
      try {
        const [statsData, trendResp] = await Promise.all([fetchStats(), fetchTrend()]);
        setStats(statsData);
        setTrendData(
          (trendResp.trend ?? []).map((p: { date: string; averageCO2: number }) => ({
            date: p.date,
            name: 'Daily Average',
            co2: p.averageCO2,
            industryAverageCo2: 0.5,
          }))
        );
      } catch (e) {
        console.error('Failed to load homepage stats:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = stats
    ? [
        { title: 'Total Indexes Run', value: formatNumber(stats.totalIndexesRun), footer: timeSinceMidnight },
        { title: 'Average CO2', value: `${stats.averageCO2Grams.toFixed(3)} g`, footer: 'per 1 view' },
        { title: '% Green Hosted', value: `${stats.greenHostedPercent.toFixed(2)}%`, footer: 'of indexed sites' },
      ]
    : [];

  return (
    <>
      {/* Quick Glance Section */}
      <section id="summary" className="container py-8 md:py-12 lg:py-12">
        <div className="mx-auto flex flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            Quick Glance
          </h2>
        </div>
        <div className="mx-auto max-w-[64rem] overflow-x-auto pt-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4 pb-10">
            {loading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)
              : cards.map((card) => (
                  <Card key={card.title} className="hover:shadow hover:shadow-xl hover:shadow-emerald-500/50">
                    <CardHeader>
                      <CardTitle className="tracking-tight text-sm font-medium text-center">
                        {card.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-6xl font-bold text-center">{card.value}</p>
                    </CardContent>
                    <CardFooter>
                      <p className="m-auto text-xs text-muted-foreground text-center">{card.footer}</p>
                    </CardFooter>
                  </Card>
                ))}
          </div>
        </div>
      </section>

      {/* 30-Day Trend Chart */}
      <section id="trend" className="container py-8 md:py-12 lg:py-12">
        <div className="mx-auto flex flex-col items-center space-y-4 text-center pb-8">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
            30-Day Trend
          </h2>
          <p className="max-w-[85%] lg:max-w-[55%] leading-normal text-muted-foreground sm:text-lg sm:leading-7 balance-text">
            Average CO2 per page view across all monitored sites. The lower line is the
            0.5 g global industry average for reference.
          </p>
        </div>
        <div className="mx-auto max-w-[64rem] rounded-lg border bg-background">
          {loading ? (
            <Skeleton className="h-[18rem] rounded-lg" />
          ) : (
            <AreaChartWrapper data={trendData} />
          )}
        </div>
      </section>
    </>
  );
}
