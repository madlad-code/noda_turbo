'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap, AlertTriangle, Droplets, ShieldCheck } from 'lucide-react';
import { RetrospectDataPoint } from '@/lib/graphql/types';

interface KPICardsProps {
  data: RetrospectDataPoint[];
}

export function KPICards({ data }: KPICardsProps) {
  const stats = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { avgEfficiency: 0, totalOverflow: 0, criticalFaults: 0, dataQuality: 0 };
    }

    const uniqueData = Array.from(new Map(data.map(item => [item.uuid, item])).values());

    const totalEfficiency = uniqueData.reduce((sum, item) => sum + (item.efficiency || 0), 0);
    const totalOverflow = uniqueData.reduce((sum, item) => sum + (item.overflow_abs || 0), 0);
    const criticalFaults = uniqueData.filter(item =>
      (item.fault_heat_sys || 0) > 0.1 ||
      (item.fault_valve || 0) > 0.1 ||
      (item.fault_transfer || 0) > 0.1
    ).length;

    const qualityIssues = uniqueData.reduce((sum, item) => {
        return sum + (item.data_quality_missing_odt || 0) + (item.data_quality_outlier_odt || 0);
    }, 0);
    const dataQuality = Math.max(0, 100 - (qualityIssues / uniqueData.length) * 100);

    return {
      avgEfficiency: totalEfficiency / uniqueData.length,
      totalOverflow: totalOverflow,
      criticalFaults,
      dataQuality,
    };
  }, [data]);

  return (
    <div id="retrospect-kpi-group" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card id="retrospect-kpi-avg-efficiency">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgEfficiency.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card id="retrospect-kpi-total-overflow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Overflow</CardTitle>
          <Droplets className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOverflow.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
        </CardContent>
      </Card>
      <Card id="retrospect-kpi-buildings-with-faults">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Buildings with Faults</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${stats.criticalFaults > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.criticalFaults > 0 ? 'text-red-500' : ''}`}>{stats.criticalFaults}</div>
        </CardContent>
      </Card>
      <Card id="retrospect-kpi-data-quality">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dataQuality.toFixed(0)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}