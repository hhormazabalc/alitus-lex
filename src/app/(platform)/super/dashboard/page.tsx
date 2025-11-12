'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { requireAuth } from '@/lib/auth/roles';
import { getSaaSOverview, listBillingEvents, listSaaSOrganizations } from '@/lib/actions/saas';
import { SuperDashboard } from '@/components/super/SuperDashboard';

export default async function SuperDashboardPage() {
  const profile = await requireAuth('admin_firma');
  if (profile.membership_role !== 'owner') {
    redirect('/dashboard/admin');
  }

  const modeCookie = (await cookies()).get('lex_mode')?.value;
  if (modeCookie === 'demo') {
    redirect('/dashboard/admin');
  }

  const [overview, organizations, billingEvents] = await Promise.all([
    getSaaSOverview(),
    listSaaSOrganizations(),
    listBillingEvents(15),
  ]);

  return <SuperDashboard overview={overview} organizations={organizations} billingEvents={billingEvents} />;
}
