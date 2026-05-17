'use client';

import { MostWantedTable } from './MostWantedTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RetrospectDataPoint } from '@/lib/graphql/types';

interface AnalysisSectionProps {
  data: RetrospectDataPoint[];
  onSelectBuilding: (building: RetrospectDataPoint) => void;
  selectedBuildingId?: string | null;
}

export function AnalysisSection({ data, onSelectBuilding, selectedBuildingId }: AnalysisSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Building Performance Leaderboard</CardTitle>
        <CardDescription>Click on a building to see its detailed atomic data.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MostWantedTable 
            data={data} 
            onSelectBuilding={onSelectBuilding}
            selectedBuildingId={selectedBuildingId}
          />
        </div>
        <div className="p-4 border border-dashed rounded-lg h-full min-h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20">
          <p>Map Visualization Placeholder</p>
        </div>
      </CardContent>
    </Card>
  );
}