'use client';
import * as React from 'react';
import { useQuery } from '@apollo/client';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';
import { GET_RETROSPECT_DATA } from '@/lib/graphql/queries';
import { RetrospectDataPoint } from '@/lib/graphql/types';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { KPICards } from './KPICards';
import { AnalysisSection } from './AnalysisSection';
import { BuildingDetailTabs } from './BuildingDetailTabs';
import { useHighlightEffect } from '@/lib/hooks/useHighlightEffect';

export function RetrospectView() {
  // Add the highlighting hook
  useHighlightEffect();
  
  const [selectedBuilding, setSelectedBuilding] = React.useState<RetrospectDataPoint | null>(null);
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  
  const { loading, error, data } = useQuery(GET_RETROSPECT_DATA, {
    variables: {
      dateFilter: {
        startDate: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
        endDate: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
      },
    },
    skip: !date?.from || !date?.to,
  });
  
  const retrospectData: RetrospectDataPoint[] = data?.retrospectData || [];
  
  const handleSelectBuilding = (building: RetrospectDataPoint | null) => {
    if (selectedBuilding && building && selectedBuilding.id === building.id) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
    }
  };
  
  if (error) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
        </Alert>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <DatePickerWithRange date={date} setDate={setDate} />
      </div>
      {loading ? (
        <RetrospectSkeleton />
      ) : (
        <>
          <KPICards data={retrospectData} />
          <AnalysisSection
            data={retrospectData}
            onSelectBuilding={handleSelectBuilding}
            selectedBuildingId={selectedBuilding?.id}
          />
          {selectedBuilding && (
            <div className="animate-in fade-in-50">
                <BuildingDetailTabs buildingData={selectedBuilding} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RetrospectSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}