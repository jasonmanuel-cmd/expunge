'use server'

import { getSessionUser } from '@/lib/auth'
import { q1, update } from '@/lib/db'

export interface MyProfile {
  full_name: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  ssn_last4: string | null
  date_of_birth: string | null
}

/** The signed-in user's own profile (replaces the browser's direct profiles read). */
export async function getMyProfileAction(): Promise<MyProfile | null> {
  const user = await getSessionUser()
  if (!user) return null
  return q1<MyProfile & Record<string, unknown>>(
    `select full_name, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth
       from profiles where id = $1`,
    [user.id]
  )
}

function clean(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

/**
 * Updates the signed-in user's own profile. Only these columns can change;
 * role is never written here (this replaces the role-change trigger).
 */
export async function updateMyProfileAction(input: Partial<MyProfile>): Promise<{ error: string | null }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Please log in again.' }

  const dob = clean(input.date_of_birth, 10)
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { error: 'Enter a valid date of birth.' }
  const ssn = clean(input.ssn_last4, 4)
  if (ssn && !/^\d{4}$/.test(ssn)) return { error: 'SSN last 4 must be 4 digits.' }

  await update(
    'profiles',
    {
      full_name: clean(input.full_name, 120),
      address_line1: clean(input.address_line1),
      address_line2: clean(input.address_line2),
      city: clean(input.city, 100),
      state: clean(input.state, 2)?.toUpperCase() ?? null,
      zip_code: clean(input.zip_code, 10),
      ssn_last4: ssn,
      date_of_birth: dob,
    },
    { id: user.id }
  )
  return { error: null }
}
