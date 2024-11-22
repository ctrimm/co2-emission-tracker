"use client"

import { useEffect, useState } from "react";
import { columns, type Emission } from "../emission/columns"
import { DataTable } from "./data-table"
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from "recharts";

interface WrapperProps {
  "client:load": boolean;
  domain?: string;
}

interface ChartDataPoint {
  date: string;
  name: string;
  co2: number;
  industryAverageCo2: number;
}

interface AreaWrapperProps {
  "client:load": boolean;
  data: ChartDataPoint[];
}

const TableWrapper = (props: WrapperProps) => {
  const [data, setData] = useState<Emission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: emissions, error } = await supabase
          .from('website_emissions')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setData(emissions || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-4">
      <DataTable columns={columns} data={data} />
    </div>
  );
}

const AreaChartWrapper = ({ data }: AreaWrapperProps) => {
  if (!data || data.length === 0) {
    return <div>No chart data available</div>;
  }

  return (
    <div className="container mx-auto h-[18rem]">
      <ResponsiveContainer height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0
          }}
        >
          <defs>
            <linearGradient id="colorco2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="co2" 
            stroke="#8884d8" 
            fill="#8884d8" 
            name="CO2 Emissions"
          />
          <Area 
            type="monotone" 
            dataKey="industryAverageCo2" 
            stroke="#82ca9d" 
            fillOpacity={1} 
            fill="url(#colorPv)"
            name="Industry Average"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { TableWrapper, AreaChartWrapper }
