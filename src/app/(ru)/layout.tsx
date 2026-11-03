import { rootMetadata, RootHtml } from '../RootHtml';

export const metadata = rootMetadata('ru');

export default function RussianLayout({ children }: LayoutProps<'/'>) {
  return <RootHtml lang="ru">{children}</RootHtml>;
}
