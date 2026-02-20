import { useState, useEffect } from 'react';
import { AreaChartWrapper } from "./ui/wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { fetchDomainEmissions } from '@/lib/api';

// Approximate average CO2 per page view (grams) by industry.
// Based on the Sustainable Web Design methodology and Website Carbon benchmarks.
// The global average (~0.5 g) is used as the fallback for unknown industries.
const INDUSTRY_AVERAGES: Record<string, number> = {
  'government':  0.60,
  'federal':     0.60,
  'state':       0.60,
  'local':       0.55,
  'municipal':   0.55,
  'education':   0.40,
  'university':  0.40,
  'healthcare':  0.50,
  'health':      0.50,
  'finance':     0.40,
  'financial':   0.40,
  'banking':     0.40,
  'technology':  0.30,
  'tech':        0.30,
  'media':       0.80,
  'news':        0.80,
  'publishing':  0.75,
  'retail':      0.70,
  'ecommerce':   0.70,
  'nonprofit':   0.40,
  'non-profit':  0.40,
};

function getIndustryAverage(industry: string | null): number {
  if (!industry) return 0.5;
  const key = industry.toLowerCase();
  if (INDUSTRY_AVERAGES[key] !== undefined) return INDUSTRY_AVERAGES[key];
  for (const [k, v] of Object.entries(INDUSTRY_AVERAGES)) {
    if (key.includes(k)) return v;
  }
  return 0.5;
}

const LIMIT_OPTIONS = [7, 30, 90] as const;
type Limit = typeof LIMIT_OPTIONS[number];

interface WebsiteStatsProps {
  domain: string;
}

interface WebsiteEmission {
  date: string;
  estimated_co2_grams: number;
  is_green: boolean;
  total_bytes: number;
}

interface MonitoredSite {
  industry: string;
  domain_type: string;
  website_emissions: WebsiteEmission[];
}

export function WebsiteStats({ domain }: WebsiteStatsProps) {
  const [siteData, setSiteData] = useState<MonitoredSite | null>(null);
  const [totalScanCount, setTotalScanCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<Limit>(30);

  // Time since midnight calculation
  const now = new Date();
  const estNow = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const midnightEst = new Date(estNow);
  midnightEst.setHours(0, 0, 0, 0);
  const diffHours = Math.floor((Number(now) - Number(midnightEst)) / 1000 / 60 / 60);
  const timeSinceMidnight = `~${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { siteData, totalScans } = await fetchDomainEmissions(domain, limit);

        if (!isMounted) return;

        if (!siteData) throw new Error('No data found for this website');
        if (!siteData.website_emissions?.length) throw new Error('No emissions data found');

        setSiteData(siteData);
        setTotalScanCount(totalScans);
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [domain, limit]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-[64rem] mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try again later or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    );
  }

  if (!siteData) {
    return (
      <Alert className="max-w-[64rem] mx-auto mt-8">
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>
          No data found for domain: {domain}
        </AlertDescription>
      </Alert>
    );
  }

  const latestScan = siteData.website_emissions[0];
  const totalScans = siteData.website_emissions.length;

  // Calculate averages
  const averageGramsPerLoad = siteData.website_emissions.reduce((acc, cur) =>
    acc + (cur.estimated_co2_grams || 0), 0) / totalScans;

  const averageBytesPerLoad = siteData.website_emissions.reduce((acc, cur) =>
    acc + (cur.total_bytes || 0), 0) / totalScans;
  const averageMBPerLoad = averageBytesPerLoad / 1048576;

  const industryAverageCO2 = getIndustryAverage(siteData.industry);
  const co2Difference = ((averageGramsPerLoad - industryAverageCO2) / industryAverageCO2) * 100;

  // Trend calculation
  const trend = latestScan.estimated_co2_grams - averageGramsPerLoad;
  const trendArrow = trend > 5 ? '↑' : trend < -5 ? '↓' : '--';
  const trendSubText = trend > 5 ? 'up' : trend < -5 ? 'down' : 'relatively flat';

  // Coffee calculation — 21g CO2 per cup (approx 0.021kg, matching columns.tsx)
  const co2EmissionsPerCupOfCoffee = 21;
  const pageViews = 1_000_000;
  const cupsOfCoffee = (averageGramsPerLoad / co2EmissionsPerCupOfCoffee) * pageViews;

  const topCards = [
    {
      title: "Industry",
      content: siteData.industry || "Unknown",
      footer: siteData.domain_type || "website"
    },
    {
      title: "Total Times Indexed",
      content: formatNumber(totalScanCount || 0),
      footer: timeSinceMidnight
    },
    {
      title: "Green Hosted",
      content: latestScan.is_green ? "YES" : "NO",
      className: cn({
        'text-emerald-500': latestScan.is_green,
        'text-red-500': !latestScan.is_green,
      }),
      footer: "current status"
    },
    {
      title: "Average CO2",
      content: `${averageGramsPerLoad.toFixed(3)} g`,
      footer: "per page view"
    }
  ];

  const bottomCards = [
    {
      title: "Emissions Trending",
      content: trendArrow,
      footer: trendSubText
    },
    {
      title: "Per Page Load",
      content: `${averageMBPerLoad.toFixed(2)} MB`,
      footer: "on average"
    },
    {
      title: "Compared to Industry Avg.",
      content: `${Math.abs(co2Difference).toFixed(2)}% ${co2Difference >= 0 ? '↑' : '↓'}`,
      className: cn({
        'text-emerald-500': co2Difference < 0,
        'text-red-500': co2Difference >= 0,
      }),
      footer: `vs. ${industryAverageCO2.toFixed(2)} g ${siteData.industry || 'industry'} avg.`
    },
    {
      title: "# of Coffees",
      content: formatNumber(Math.round(cupsOfCoffee)),
      footer: "for every 1M Visitors"
    }
  ];

  // Chart data transformation
  const chartData = siteData.website_emissions
    .map((scan) => ({
      date: new Date(scan.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      name: 'Scan',
      co2: Number(scan.estimated_co2_grams) || 0,
      industryAverageCo2: industryAverageCO2
    }))
    .reverse();

  return (
    <>
      {/* Top Cards */}
      <div className="mx-auto grid gap-4 md:grid-cols-4 max-w-[64rem] pt-8">
        {topCards.map(card => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-center">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-4xl font-bold text-center", card.className)}>{card.content}</p>
              <p className="text-sm text-muted-foreground text-center mt-2">{card.footer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <div className="mx-auto max-w-[64rem] pt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Last {totalScans} scans</CardTitle>
            <div className="flex gap-1">
              {LIMIT_OPTIONS.map(n => (
                <Button
                  key={n}
                  size="sm"
                  variant={limit === n ? "default" : "outline"}
                  onClick={() => setLimit(n)}
                >
                  {n}d
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <AreaChartWrapper client:load data={chartData} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Cards */}
      <div className="mx-auto grid gap-4 md:grid-cols-4 max-w-[64rem] pt-8">
        {bottomCards.map(card => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle className="text-center">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-4xl font-bold text-center", card.className)}>{card.content}</p>
              <p className="text-sm text-muted-foreground text-center mt-2">{card.footer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
