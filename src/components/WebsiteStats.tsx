import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChartWrapper } from "./ui/wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
        
        const { data, error: supabaseError } = await supabase
          .from('monitored_sites')
          .select(`
            industry,
            domain_type,
            website_emissions!inner (
              date,
              estimated_co2_grams,
              is_green,
              total_bytes
            )
          `)
          .eq('domain', domain)
          .order('date', { foreignTable: 'website_emissions', ascending: false })
          .limit(7, { foreignTable: 'website_emissions' })
          .single();
        
        // Get total count in a separate query
        const { data: countData, count: totalScanCount } = await supabase
          .from('website_emissions')
          .select('*', { count: 'exact', head: true })
          .eq('domain', domain);

        if (!isMounted) return;

        if (supabaseError) throw new Error(supabaseError.message);
        if (!data) throw new Error('No data found for this website');
        if (!data.website_emissions?.length) throw new Error('No emissions data found');
        
        setSiteData(data);
        setTotalScanCount(totalScanCount || 0);  // Set the total count
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (domain) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [domain]);

  // Debug render
  console.log('Render state:', { loading, error, siteData });

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

  // Industry comparison (placeholder - replace with actual industry data)
  const industryAverageCO2 = 0.5;
  const co2Difference = ((averageGramsPerLoad - industryAverageCO2) / industryAverageCO2) * 100;

  // Trend calculation
  const trend = latestScan.estimated_co2_grams - averageGramsPerLoad;
  const trendArrow = trend > 5 ? '↑' : trend < -5 ? '↓' : '--';
  const trendSubText = trend > 5 ? 'up' : trend < -5 ? 'down' : 'relatively flat';

  // Coffee calculation
  const co2EmissionsPerCupOfCoffee = 400;
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
      footer: "from industry avg."
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
      industryAverageCo2: industryAverageCO2  // Changed from industryAverageCO2 to match interface
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
          <CardHeader>
            <CardTitle>Last {totalScans} scans</CardTitle>
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
