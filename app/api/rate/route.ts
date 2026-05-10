import { NextResponse } from 'next/server';
import { getUsdToGhsRate } from '@/lib/currency';

export const revalidate = 3600;

export async function GET() {
  const data = await getUsdToGhsRate();
  return NextResponse.json(data);
}
