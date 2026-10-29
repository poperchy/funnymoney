import type { Metadata } from 'next';
import { AppClient } from './AppClient';

export const metadata: Metadata = {
  title: 'Стена — Наличка',
  robots: { index: false },
};

export default function AppPage() {
  return <AppClient />;
}
