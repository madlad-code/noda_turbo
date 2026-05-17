// =================================================================
// FILE: apps/graphql-api/src/export/index.ts
// =================================================================
import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/csv', async (req: Request, res: Response) => {
  console.log('CSV export requested.');
  const dummyCsv = 'uuid,building_control,efficiency\n"uuid-1","Building A",95.2';
  res.header('Content-Type', 'text/csv');
  res.attachment('dashboard_data.csv');
  res.send(dummyCsv);
});

export default router;