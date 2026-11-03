import type { Metadata } from 'next';
import { dictionaries } from '@/lib/i18n';
import { AppClient } from './AppClient';

export const metadata: Metadata = {
  title: dictionaries.ru.meta.appTitle,
  robots: { index: false },
};

export default function AppPage() {
  return <AppClient />;
}
