import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * DELETE /api/partner/clients
 * Body: { consumerId: string }
 * A firm removes one of its clients, freeing a client seat. The client keeps
 * their account and past letters but is no longer covered by this firm.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { consumerId?: unknown }
    const consumerId = typeof body.consumerId === 'string' && UUID.test(body.consumerId) ? body.consumerId : null
    if (!consumerId) return NextResponse.json({ error: 'Pick a client to remove.' }, { status: 400 })

    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'partner') {
      return NextResponse.json({ error: 'Only firm accounts can remove clients.' }, { status: 403 })
    }

    // Only this firm's own link is removed, never another firm's.
    const { data: removed, error } = await supabase
      .from('partner_clients')
      .delete()
      .eq('partner_id', user.id)
      .eq('consumer_id', consumerId)
      .select('consumer_id')
    if (error) throw error
    if (!removed || removed.length === 0) {
      return NextResponse.json({ error: 'That client isn\'t linked to your firm.' }, { status: 404 })
    }

    return NextResponse.json({ removed: true })
  } catch (err) {
    console.error('partner remove client error:', err)
    return NextResponse.json({ error: 'Could not remove this client.' }, { status: 500 })
  }
}
