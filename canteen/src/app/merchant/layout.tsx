import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { MerchantLayout } from '@/components/layout/MerchantLayout';

export default async function MerchantRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'merchant') {
    redirect('/login');
  }

  return <MerchantLayout>{children}</MerchantLayout>;
}
