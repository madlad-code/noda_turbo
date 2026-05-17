// FILE: apps/web/app/(dashboard)/page.tsx
import { Suspense } from 'react';
import { getClient } from '@/lib/apollo-rsc';
import { GET_OVERVIEW_PAGE_DATA } from '@/lib/graphql/queries';
import { OverviewView } from '@/components/views/overview/OverviewView';
import { OverviewSkeleton } from '@/components/views/overview/OverviewView';

export default async function OverviewPage() {
  const client = getClient();
  const { data, error } = await client.query({
    query: GET_OVERVIEW_PAGE_DATA,
    fetchPolicy: 'no-cache',
  });
  
  if (error) {
    return <p className="p-8 text-red-500">Error: {error.message}</p>;
  }
  
  return (
    <>
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewView initialData={data} />
      </Suspense>
    </>
  );
}