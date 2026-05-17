'use client';

import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RetrospectDataPoint } from '@/lib/graphql/types';
import { sanitizeForId } from '@/lib/utils'; // Import our utility

interface MostWantedTableProps {
  data: RetrospectDataPoint[];
  onSelectBuilding: (building: RetrospectDataPoint) => void;
  selectedBuildingId?: string | null;
}

export function MostWantedTable({ data, onSelectBuilding, selectedBuildingId }: MostWantedTableProps) {
  const rankedData = React.useMemo(() => {
    const uniqueBuildings = Array.from(new Map(data.map(item => [item.uuid, item])).values());
    return uniqueBuildings.sort((a, b) => (b.most_wanted || 0) - (a.most_wanted || 0));
  }, [data]);

  const getFaultScore = (item: RetrospectDataPoint) => {
    return (item.fault_heat_sys || 0) + (item.fault_valve || 0) + (item.fault_transfer || 0);
  }

  return (
    <div className="rounded-md border">
      <Table id="retrospect-leaderboard-table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Rank</TableHead>
            <TableHead>Building Name</TableHead>
            <TableHead className="text-right">Efficiency</TableHead>
            <TableHead className="text-right">Fault Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankedData.map((item, index) => (
            <TableRow
              key={item.id}
              id={`leaderboard-row-${sanitizeForId(item.id)}`}
              onClick={() => onSelectBuilding(item)}
              className={cn(
                "cursor-pointer hover:bg-muted/50",
                item.id === selectedBuildingId && "bg-muted"
              )}
            >
              <TableCell className="font-medium" id={`leaderboard-cell-rank-${sanitizeForId(item.id)}`}>
                #{index + 1}
              </TableCell>
              <TableCell id={`leaderboard-cell-name-${sanitizeForId(item.id)}`}>
                {item.building_control}
              </TableCell>
              <TableCell className="text-right" id={`leaderboard-cell-efficiency-${sanitizeForId(item.id)}`}>
                {(item.efficiency || 0).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right" id={`leaderboard-cell-fault-score-${sanitizeForId(item.id)}`}>
                <Badge variant={getFaultScore(item) > 0.1 ? "destructive" : "outline"}>
                  {getFaultScore(item).toFixed(2)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}