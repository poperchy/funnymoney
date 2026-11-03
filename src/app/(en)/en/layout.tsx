import { rootMetadata, RootHtml } from '../../RootHtml';

export const metadata = rootMetadata('en');

export default function EnglishLayout({ children }: LayoutProps<'/en'>) {
  return <RootHtml lang="en">{children}</RootHtml>;
}
