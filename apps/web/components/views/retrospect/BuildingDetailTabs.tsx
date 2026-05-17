'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { RetrospectDataPoint } from '@/lib/graphql/types';
import { sanitizeForId } from '@/lib/utils'; // Import our utility

interface BuildingDetailTabsProps {
  buildingData: RetrospectDataPoint;
}

interface DetailData {
    name: string;
    value: number | null | undefined;
    unit?: string;
}

function DetailTabContent({ title, data, tabValue, buildingId }: { title: string, data: DetailData[], tabValue: string, buildingId: string }) {
    return (
        <TabsContent value={tabValue}>
            <div className="mt-6">
                <div className="rounded-md border">
                    <Table id={`details-table-${tabValue}-${buildingId}`}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map(item => (
                                <TableRow key={item.name} id={`details-row-${tabValue}-${sanitizeForId(item.name)}-${buildingId}`}>
                                    <TableCell className="font-medium" id={`details-cell-name-${tabValue}-${sanitizeForId(item.name)}-${buildingId}`}>
                                      {item.name}
                                    </TableCell>
                                    <TableCell className="text-right" id={`details-cell-value-${tabValue}-${sanitizeForId(item.name)}-${buildingId}`}>
                                        <Badge variant={ (item.value || 0) > 0.1 && title === "Faults" ? "destructive" : "outline"}>
                                            {(item.value || 0).toFixed(2)} {item.unit || ''}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TabsContent>
    );
}


export function BuildingDetailTabs({ buildingData }: BuildingDetailTabsProps) {

  const faultData: DetailData[] = [
    { name: 'Primary Loss', value: buildingData.fault_prim_loss },
    { name: 'Smirch', value: buildingData.fault_smirch },
    { name: 'Heat System', value: buildingData.fault_heat_sys },
    { name: 'Valve', value: buildingData.fault_valve },
    { name: 'Transfer', value: buildingData.fault_transfer },
  ];

  const tempData: DetailData[] = [
      { name: 'Delta Temp (Absolute)', value: buildingData.dt_abs, unit: '°C' },
      { name: 'Delta Temp (Volume Weighted)', value: buildingData.dt_vw, unit: '°C' },
      { name: 'Delta Temp (Ideal)', value: buildingData.dt_ideal, unit: '°C' },
      { name: 'Return Temp (Absolute)', value: buildingData.rt_abs, unit: '°C' },
      { name: 'Return Temp (Volume Weighted)', value: buildingData.rt_vw, unit: '°C' },
  ];

  const demandData: DetailData[] = [
      { name: 'Demand Signature', value: buildingData.demand_sig, unit: '' },
      { name: 'Demand Flexible', value: buildingData.demand_flex, unit: '' },
      { name: 'Volume (Absolute)', value: buildingData.volume_abs, unit: 'm³' },
      { name: 'Overflow (Absolute)', value: buildingData.overflow_abs, unit: '' },
  ];

  const substationData: DetailData[] = [
      { name: 'Efficiency', value: buildingData.efficiency, unit: '%' },
      { name: 'NTU', value: buildingData.ntu, unit: '' },
      { name: 'LMTD', value: buildingData.lmtd, unit: '' },
      { name: 'Supply (Absolute)', value: buildingData.supply_abs, unit: '' },
  ];

  const safeBuildingId = sanitizeForId(buildingData.id);

  return (
    <Card id={`building-details-card-${safeBuildingId}`}>
        <CardHeader>
            <CardTitle>{buildingData.building_control}</CardTitle>
            <CardDescription>
                Detailed atomic data for the selected building and time period.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="faults" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="faults">Faults</TabsTrigger>
                    <TabsTrigger value="temperatures">Temperatures</TabsTrigger>
                    <TabsTrigger value="demand">Demand & Flow</TabsTrigger>
                    <TabsTrigger value="substation">Substation</TabsTrigger>
                </TabsList>

                <DetailTabContent title="Faults" data={faultData} tabValue="faults" buildingId={safeBuildingId} />
                <DetailTabContent title="Temperatures" data={tempData} tabValue="temperatures" buildingId={safeBuildingId} />
                <DetailTabContent title="Demand & Flow" data={demandData} tabValue="demand" buildingId={safeBuildingId} />
                <DetailTabContent title="Substation" data={substationData} tabValue="substation" buildingId={safeBuildingId} />
            </Tabs>
        </CardContent>
    </Card>
  );
}