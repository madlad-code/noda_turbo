// FILE: apps/data-ingestion-service/src/util/normalize-headers.ts

import { CsvRow } from '../../db';

function toSnakeCase(header: string): string {
  if (!header) return '';
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s()-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');
}

export function normalizeCsvHeaders(data: CsvRow[]): CsvRow[] {
  return data.map(row => {
    const newRow: CsvRow = {};
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        newRow[toSnakeCase(key)] = row[key];
      }
    }
    return newRow;
  });
}