import { NextResponse } from 'next/server'
import { store } from '@/lib/db/store'
import { randomDelay } from '@/lib/mock/latency'

export async function GET() {
  await randomDelay(200, 500)
  return NextResponse.json(store.getWallet())
}
