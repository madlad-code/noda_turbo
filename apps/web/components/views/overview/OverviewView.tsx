'use client';

import { useQuery } from '@apollo/client';
import { GET_OVERVIEW_PAGE_DATA } from '@/lib/graphql/queries';
import type { OverviewPageData, Building } from '@/lib/graphql/types';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useHighlightEffect } from '@/lib/hooks/useHighlightEffect';

// Import shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Import Lucide React icons
import { Building as BuildingIcon, Activity } from 'lucide-react';
// Import the new simple chart
import { WeatherTrendSimpleChart } from './WeatherTrendSimpleChart';
import { sanitizeForId } from '@/lib/utils'; // Import our new utility

const SystemsMap = dynamic(() => import('./SystemsMap').then(mod => mod.SystemsMap), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

// --- Main View Component ---
export function OverviewView() {
  // Add the highlighting hook
  useHighlightEffect();
  
  const { loading, error, data } = useQuery<OverviewPageData>(GET_OVERVIEW_PAGE_DATA);

  const { buildings, kpiData, weatherData } = useMemo(() => {
    const buildings = data?.overview?.buildings ?? [];
    const weatherData = data?.overview?.weather ?? [];

    const kpiData = {
      total: buildings.length,
      active: buildings.filter(b => b.asset_active).length,
      optimal: buildings.filter(b => b.asset_status === 'optimal').length,
      alerts: buildings.filter(b => b.asset_status === 'alert').length,
    };

    return { buildings, kpiData, weatherData };
  }, [data]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <Card className="w-full bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards */}
      <div id="overview-kpi-group" className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard id="overview-kpi-total-buildings" title="Total Buildings" value={kpiData.total.toString()} icon={BuildingIcon} />
        <KPICard id="overview-kpi-active-buildings" title="Active Buildings" value={kpiData.active.toString()} icon={Activity} />
        <KPICard id="overview-kpi-optimal-status" title="Optimal Status" value={kpiData.optimal.toString()} icon={BuildingIcon} />
        <KPICard id="overview-kpi-active-alerts" title="Active Alerts" value={kpiData.alerts.toString()} icon={Activity} />
      </div>

      {/* Row 2: Leaflet Map */}
      <Card id="overview-map-card">
        <CardHeader>
          <CardTitle>Asset Locations</CardTitle>
          <CardDescription>A geographical overview of all building assets.</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] p-2">
          <SystemsMap buildings={buildings} />
        </CardContent>
      </Card>

      {/* Row 3: Asset Table and Weather Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentBuildingsTable buildings={buildings} />
        </div>
        <div id="overview-weather-chart-container">
          <WeatherTrendSimpleChart data={weatherData} />
        </div>
      </div>
    </div>
  );
}

// --- Child Components ---

function KPICard({ id, title, value, icon: Icon }: { id: string; title: string; value: string; icon: React.ElementType }) {
  return (
    <Card id={id}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function RecentBuildingsTable({ buildings }: { buildings: Building[] }) {
  return (
    <Card id="overview-all-buildings-table-card">
      <CardHeader>
        <CardTitle>All Buildings</CardTitle>
        <CardDescription>A complete list of all assets in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buildings.map((building) => (
              <TableRow key={building.uuid} id={`table-row-building-${building.uuid}`}>
                <TableCell className="font-medium" id={`cell-building-name-${building.uuid}`}>
                  {building.name}
                </TableCell>
                <TableCell id={`cell-building-status-${building.uuid}`}>
                  <Badge variant={building.asset_status === 'optimal' ? 'default' : 'destructive'}>
                    {building.asset_status}
                  </Badge>
                </TableCell>
                <TableCell id={`cell-building-type-${building.uuid}`}>
                  {building.asset_type}
                </TableCell>
                <TableCell id={`cell-building-efficiency-${building.uuid}`}>
                  {/* Add efficiency data - you may need to update your GraphQL query to include this */}
                  <Badge variant="outline">
                    {building.efficiency ? `${(building.efficiency * 100).toFixed(1)}%` : 'N/A'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-[520px]" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}