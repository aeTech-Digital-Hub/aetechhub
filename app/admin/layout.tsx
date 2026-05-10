import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-server';
import { AdminShell } from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware has already enforced auth; this is just a defensive fallback
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=/admin/dashboard');
  if (user.role !== 'admin' && user.role !== 'editor') redirect('/');

  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
