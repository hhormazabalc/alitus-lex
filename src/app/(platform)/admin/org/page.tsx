import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireAuth } from '@/lib/auth/roles';
import { listOrganizations } from '@/lib/actions/organizations';
import { OrganizationManager } from '@/components/admin/OrganizationManager';

export const metadata: Metadata = {
  title: 'Empresas y Workspaces - LEX Altius',
};

export default async function AdminOrganizationsPage() {
  const profile = await requireAuth();

  if (profile.role !== 'admin_firma') {
    redirect('/dashboard');
  }

  const organizations = await listOrganizations();

  return (
    <div className='container mx-auto py-10 space-y-8'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-altius-neutral-900'>Empresas y workspaces</h1>
        <p className='text-sm text-muted-foreground'>
          Crea nuevas firmas o unidades de negocio, vincula dominios personalizados y cambia rápidamente entre tus organizaciones activas.
        </p>
      </div>

      <OrganizationManager currentOrgId={profile.org_id ?? ''} organizations={organizations} />
    </div>
  );
}
