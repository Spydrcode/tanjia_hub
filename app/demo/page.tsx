import { redirect } from 'next/navigation';
import { requireAuthOrRedirect } from '@/lib/auth/redirect';

export default async function DemoPage() {
  await requireAuthOrRedirect();
  // Redirect demo root to demo today dashboard
  redirect('/demo/today');
}
