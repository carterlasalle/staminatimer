import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'staminatimer',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
