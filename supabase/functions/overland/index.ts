import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Token auth via ?token=... query param (set this in Overland's receiver URL)
  const token = new URL(req.url).searchParams.get('token')
  if (!token || token !== Deno.env.get('OVERLAND_TOKEN')) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: { locations?: unknown[] }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const locations = body.locations
  if (!Array.isArray(locations) || locations.length === 0) {
    return new Response(JSON.stringify({ result: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Overland sends oldest→newest; take the last entry
  const latest = locations[locations.length - 1] as {
    geometry: { coordinates: [number, number] }
    properties: { timestamp: string; horizontal_accuracy?: number; speed?: number }
  }

  const [longitude, latitude] = latest.geometry.coordinates
  const accuracy = latest.properties.horizontal_accuracy ?? null
  const updated_at = latest.properties.timestamp
  // speed arrives in m/s; -1 means unknown
  const rawSpeed = latest.properties.speed
  const speed = rawSpeed != null && rawSpeed >= 0 ? rawSpeed : null
  console.log('props:', JSON.stringify(latest.properties))

  const { error } = await supabase
    .from('bobby_location')
    .upsert({ id: 1, latitude, longitude, accuracy, speed, updated_at })

  if (error) {
    console.error('Supabase upsert error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ result: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
