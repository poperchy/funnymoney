import type * as React from 'react';
export interface LogoProps { section?: string; size?: 'md' | 'sm'; name?: string; hideWord?: boolean; className?: string }
export declare function Logo(props: LogoProps): React.ReactElement | null;
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'dark' | 'secondary' | 'glass' | 'soft' | 'link' | 'success'; size?: 'sm' | 'md' | 'lg' | 'xl'; href?: string; block?: boolean }
export declare function Button(props: ButtonProps): React.ReactElement | null;
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { label: string; glass?: boolean }
export declare function IconButton(props: IconButtonProps): React.ReactElement | null;
export interface SegmentedOption { label: React.ReactNode; value: string | number }
export interface SegmentedControlProps { options: Array<string | SegmentedOption>; value?: string | number; defaultValue?: string | number; onChange?: (v: any) => void; label?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement | null;
export interface FilterPillsProps { options: Array<{ label: string; count?: number }>; value?: string; defaultValue?: string; onChange?: (label: string) => void }
export declare function FilterPills(props: FilterPillsProps): React.ReactElement | null;
export interface ChipProps { tone?: 'benchmark' | 'comparison' | 'role' | 'engineering' | 'neutral' | 'featured'; children: React.ReactNode }
export declare function Chip(props: ChipProps): React.ReactElement | null;
export interface TagProps { size?: 'md' | 'sm'; tone?: 'danger'; href?: string; children: React.ReactNode }
export declare function Tag(props: TagProps): React.ReactElement | null;
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; multiline?: boolean; full?: boolean; rows?: number }
export declare function Field(props: FieldProps): React.ReactElement | null;
export interface InlineFormProps { action?: string; doneLabel?: string; placeholder?: string; type?: string; label?: string; size?: 'md' | 'sm'; onSubmit?: (value: string) => void }
export declare function InlineForm(props: InlineFormProps): React.ReactElement | null;
export interface SwitchProps { label: string; checked?: boolean; defaultChecked?: boolean; locked?: boolean; onChange?: (on: boolean) => void }
export declare function Switch(props: SwitchProps): React.ReactElement | null;
export interface MediaPlaceholderProps { src?: string; alt?: string; video?: boolean; label?: string; ratio?: string; background?: string; style?: React.CSSProperties; className?: string }
export declare function MediaPlaceholder(props: MediaPlaceholderProps): React.ReactElement | null;
export interface BreadcrumbProps { items: Array<{ label: string; href?: string }> }
export declare function Breadcrumb(props: BreadcrumbProps): React.ReactElement | null;
export interface ArticleHeaderProps { title: React.ReactNode; lead?: React.ReactNode; author?: { name: string; role?: string; initial?: string; avatar?: string }; date?: string; datetime?: string; readTime?: string; breadcrumb?: BreadcrumbProps['items'] }
export declare function ArticleHeader(props: ArticleHeaderProps): React.ReactElement | null;
export interface TableOfContentsProps { items: Array<{ href: string; label: string }>; active?: string; title?: string }
export declare function TableOfContents(props: TableOfContentsProps): React.ReactElement | null;
export interface ReadingProgressProps { value?: number; inline?: boolean }
export declare function ReadingProgress(props: ReadingProgressProps): React.ReactElement | null;
export interface ProseProps { html?: string; children?: React.ReactNode; className?: string }
export declare function Prose(props: ProseProps): React.ReactElement | null;
export interface CalloutProps { kind?: 'note' | 'warning'; label?: string; children: React.ReactNode }
export declare function Callout(props: CalloutProps): React.ReactElement | null;
export interface CodeFile { label?: string; lang?: string; code: string }
export interface CodeBlockProps { code?: string; filename?: string; lang?: string; files?: CodeFile[]; window?: boolean; plain?: boolean }
export declare function CodeBlock(props: CodeBlockProps): React.ReactElement | null;
export type Cell = React.ReactNode | { value: React.ReactNode; tone?: 'bad' | 'good' }
export interface DataTableProps { columns: string[]; rows: Cell[][]; note?: string; template?: string }
export declare function DataTable(props: DataTableProps): React.ReactElement | null;
export interface PullQuoteProps { children: React.ReactNode }
export declare function PullQuote(props: PullQuoteProps): React.ReactElement | null;
export interface StepListProps { items: Array<{ title: string; body: React.ReactNode }> }
export declare function StepList(props: StepListProps): React.ReactElement | null;
export interface FigureProps { src?: string; alt?: string; label?: string; ratio?: string; caption?: React.ReactNode }
export declare function Figure(props: FigureProps): React.ReactElement | null;
export interface ArticleCTAProps { title: string; body?: string; action?: string; href?: string }
export declare function ArticleCTA(props: ArticleCTAProps): React.ReactElement | null;
export interface PostCardProps { category: string; title: string; dek?: string; date?: string; readTime?: string; stat?: string; statNote?: string; index?: number; background?: string; href?: string; onClick?: () => void }
export declare function PostCard(props: PostCardProps): React.ReactElement | null;
export interface FeaturedPostProps { category: string; title: string; dek?: string; date?: string; readTime?: string; stat: string; statNote?: string; href?: string }
export declare function FeaturedPost(props: FeaturedPostProps): React.ReactElement | null;
export interface BlockLabelProps { n?: string; title: string; blockKey: string; id?: string }
export declare function BlockLabel(props: BlockLabelProps): React.ReactElement | null;
export interface AnnouncementBarProps { variant?: 'promo' | 'system'; badge?: string | false; href?: string; linkLabel?: string; dismissible?: boolean; children: React.ReactNode }
export declare function AnnouncementBar(props: AnnouncementBarProps): React.ReactElement | null;
export interface SiteHeaderProps { section?: string; homeHref?: string; links?: Array<{ label: string; href?: string; active?: boolean }>; cta?: { label: string; href?: string } }
export declare function SiteHeader(props: SiteHeaderProps): React.ReactElement | null;
export interface NavBarProps { variant?: 'full' | 'minimal'; section?: string; links?: Array<{ label: string; href?: string; active?: boolean }>; menuLabel?: string; menu?: Array<{ title: string; body: string; href?: string }>; defaultOpen?: boolean; signIn?: string; cta?: { label: string; href?: string } }
export declare function NavBar(props: NavBarProps): React.ReactElement | null;
export interface Action { label: string; href?: string; variant?: ButtonProps['variant']; size?: ButtonProps['size'] }
export interface HeroCenteredProps { title: React.ReactNode; highlight?: string; lead?: string; actions?: Action[]; as?: 'h1' | 'h2' }
export declare function HeroCentered(props: HeroCenteredProps): React.ReactElement | null;
export interface HeroSplitProps { title: React.ReactNode; lead?: string; actions?: Action[]; media?: string; mediaLabel?: string; as?: 'h1' | 'h2' }
export declare function HeroSplit(props: HeroSplitProps): React.ReactElement | null;
export interface LogoStripProps { caption?: string; logos?: Array<{ src?: string; alt?: string } | null> }
export declare function LogoStrip(props: LogoStripProps): React.ReactElement | null;
export interface FeatureGridProps { title?: string; items: Array<{ title: string; body: string }> }
export declare function FeatureGrid(props: FeatureGridProps): React.ReactElement | null;
export interface StatsRowProps { items: Array<{ value: string; note: string }> }
export declare function StatsRow(props: StatsRowProps): React.ReactElement | null;
export interface StepsProps { items: Array<{ title: string; body: string }> }
export declare function Steps(props: StepsProps): React.ReactElement | null;
export interface TabsMediaProps { tabs: Array<{ label: string; title: string; body: string; media?: string; mediaLabel?: string }> }
export declare function TabsMedia(props: TabsMediaProps): React.ReactElement | null;
export interface CodeShowcaseProps { title: string; body?: string; copyLabel?: string; files: CodeFile[] }
export declare function CodeShowcase(props: CodeShowcaseProps): React.ReactElement | null;
export interface GalleryProps { items: Array<{ label?: string; caption: string; src?: string; span?: 'big' | 'wide' | 'tall' }>; hint?: string; inlineLightbox?: boolean }
export declare function Gallery(props: GalleryProps): React.ReactElement | null;
export interface CardSliderProps { title: string; items: Array<{ stat: string; note: string; title: string }>; perView?: number }
export declare function CardSlider(props: CardSliderProps): React.ReactElement | null;
export interface ReviewsGridProps { items: Array<{ text: string; name: string; role: string; rating?: number }> }
export declare function ReviewsGrid(props: ReviewsGridProps): React.ReactElement | null;
export interface TestimonialSpotlightProps { items: Array<{ text: string; name: string; role: string }> }
export declare function TestimonialSpotlight(props: TestimonialSpotlightProps): React.ReactElement | null;
export interface PricingTiersProps { title: string; yearlyLabel?: string; yearlyDiscount?: number; tiers: Array<{ name: string; price: number | string; per?: string; sub?: string; features: string[]; cta: string; href?: string; featured?: boolean; badge?: string }> }
export declare function PricingTiers(props: PricingTiersProps): React.ReactElement | null;
export interface ComparisonTableProps { columns: string[]; rows: string[][] }
export declare function ComparisonTable(props: ComparisonTableProps): React.ReactElement | null;
export interface FAQProps { title: string; sub?: React.ReactNode; items: Array<{ q: string; a: React.ReactNode }>; defaultOpen?: number }
export declare function FAQ(props: FAQProps): React.ReactElement | null;
export interface LatestPostsProps { title?: string; allHref?: string; allLabel?: string; posts: PostCardProps[] }
export declare function LatestPosts(props: LatestPostsProps): React.ReactElement | null;
export interface NewsletterProps { title: string; body?: string; action?: string; onSubmit?: (email: string) => void }
export declare function Newsletter(props: NewsletterProps): React.ReactElement | null;
export interface ContactFormProps { title: string; body?: string; meta?: string[]; fields: FieldProps[]; action?: string; doneTitle?: string; doneBody?: string; onSubmit?: () => void }
export declare function ContactForm(props: ContactFormProps): React.ReactElement | null;
export interface CTABannerProps { title: string; actions?: Action[] }
export declare function CTABanner(props: CTABannerProps): React.ReactElement | null;
export interface FooterProps { variant?: 'full' | 'simple'; tagline?: string; columns?: Array<{ title: string; links: string[] }>; links?: Array<{ label: string; href?: string }>; copyright?: string; note?: string }
export declare function Footer(props: FooterProps): React.ReactElement | null;
export interface BentoTile { size?: 'big' | 'wide'; tone?: 'dark' | 'tint1' | 'tint2' | 'tint3' | 'tint4'; label: string; accent?: boolean; aside?: string; title?: string; value?: string; note?: string; text?: React.ReactNode; diffs?: Array<{ kind: 'bad' | 'new' | 'good'; file: string; cost: string }>; tags?: Array<string | { label: string; tone?: 'danger' }>; bars?: number[]; limit?: number; max?: number }
export interface BentoGridProps { title?: string; tiles: BentoTile[] }
export declare function BentoGrid(props: BentoGridProps): React.ReactElement | null;
export interface VideoDemoProps { title: string; body?: string; label?: string; duration?: string; chapters: Array<{ t: string; label: string; at?: number }> }
export declare function VideoDemo(props: VideoDemoProps): React.ReactElement | null;
export interface TimelineProps { title: string; sub?: string; items: Array<{ date: string; title: string; body: string; upcoming?: boolean }>; lastIsNext?: boolean }
export declare function Timeline(props: TimelineProps): React.ReactElement | null;
export interface CareersListProps { title?: string; emptyText?: string; jobs: Array<{ title: string; dept: string; location: string; type: string; href?: string }> }
export declare function CareersList(props: CareersListProps): React.ReactElement | null;
export interface EventsGridProps { title?: string; events: Array<{ month: string; day: string; kind: string; when: string; title: string; body: string }> }
export declare function EventsGrid(props: EventsGridProps): React.ReactElement | null;
export interface CookieConsentProps { title?: string; body: string; preferences?: Array<{ name: string; note: string; locked?: boolean }>; fixed?: boolean }
export declare function CookieConsent(props: CookieConsentProps): React.ReactElement | null;
export interface ErrorPageProps { code?: string; title?: string; body?: string; links?: Array<{ label: string; href?: string }>; trace?: string }
export declare function ErrorPage(props: ErrorPageProps): React.ReactElement | null;
export interface ComingSoonProps { title: string; body?: string; countdown?: Array<{ value: string; label: string }>; action?: string }
export declare function ComingSoon(props: ComingSoonProps): React.ReactElement | null;
declare global { interface Window { Potato: { Logo: typeof Logo; Button: typeof Button; IconButton: typeof IconButton; SegmentedControl: typeof SegmentedControl; FilterPills: typeof FilterPills; Chip: typeof Chip; Tag: typeof Tag; Field: typeof Field; InlineForm: typeof InlineForm; Switch: typeof Switch; MediaPlaceholder: typeof MediaPlaceholder; Breadcrumb: typeof Breadcrumb; ArticleHeader: typeof ArticleHeader; TableOfContents: typeof TableOfContents; ReadingProgress: typeof ReadingProgress; Prose: typeof Prose; Callout: typeof Callout; CodeBlock: typeof CodeBlock; DataTable: typeof DataTable; PullQuote: typeof PullQuote; StepList: typeof StepList; Figure: typeof Figure; ArticleCTA: typeof ArticleCTA; PostCard: typeof PostCard; FeaturedPost: typeof FeaturedPost; BlockLabel: typeof BlockLabel; AnnouncementBar: typeof AnnouncementBar; SiteHeader: typeof SiteHeader; NavBar: typeof NavBar; HeroCentered: typeof HeroCentered; HeroSplit: typeof HeroSplit; LogoStrip: typeof LogoStrip; FeatureGrid: typeof FeatureGrid; StatsRow: typeof StatsRow; Steps: typeof Steps; TabsMedia: typeof TabsMedia; CodeShowcase: typeof CodeShowcase; Gallery: typeof Gallery; CardSlider: typeof CardSlider; ReviewsGrid: typeof ReviewsGrid; TestimonialSpotlight: typeof TestimonialSpotlight; PricingTiers: typeof PricingTiers; ComparisonTable: typeof ComparisonTable; FAQ: typeof FAQ; LatestPosts: typeof LatestPosts; Newsletter: typeof Newsletter; ContactForm: typeof ContactForm; CTABanner: typeof CTABanner; Footer: typeof Footer; BentoGrid: typeof BentoGrid; VideoDemo: typeof VideoDemo; Timeline: typeof Timeline; CareersList: typeof CareersList; EventsGrid: typeof EventsGrid; CookieConsent: typeof CookieConsent; ErrorPage: typeof ErrorPage; ComingSoon: typeof ComingSoon } } }
