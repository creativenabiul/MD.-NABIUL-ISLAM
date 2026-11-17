import { ArrowUpRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { parseSectionBlocks } from '../lib/assetUrl';
import type { SectionContentBlock, WebsiteSectionItem } from '../types/portfolio';
import { SectionHeading } from './KineticTypography';
import { MagneticButton } from './MagneticButton';

function isSafeHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  );
}

function ActionLink({ block }: { block: SectionContentBlock }) {
  const href = block.href?.trim();
  if (!href || !isSafeHref(href)) return null;
  const label = block.linkLabel || block.title || 'Learn More';
  const isExternal = block.external || /^https?:\/\//i.test(href);

  if (block.type === 'button') {
    if (isExternal || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return (
        <MagneticButton href={href} variant="primary" cursorLabel="OPEN">
          <span className="inline-flex items-center gap-1.5">
            {label}
            {isExternal && <ArrowUpRight className="w-4 h-4" />}
          </span>
        </MagneticButton>
      );
    }
    return (
      <MagneticButton to={href} variant="primary" cursorLabel="VIEW">
        {label}
      </MagneticButton>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4"
      >
        {label}
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
    );
  }

  if (href.startsWith('#')) {
    return (
      <a
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4"
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4"
    >
      {label}
    </Link>
  );
}

function RenderSingleBlock({ block }: { block: SectionContentBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-2.5">
          {block.title && (
            <h3 className="font-serif text-2xl font-semibold text-[#F5F2EB]">{block.title}</h3>
          )}
          {block.body && (
            <p className="text-sm sm:text-base text-[#F5F2EB]/80 leading-relaxed whitespace-pre-line">
              {block.body}
            </p>
          )}
        </div>
      );

    case 'card':
      return (
        <article className="p-6 rounded-2xl bg-[#111114] border border-white/10 hover:border-[#D4B475]/45 transition-colors flex flex-col justify-between gap-4">
          {block.mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10 aspect-[16/10] bg-[#070708]">
              <img
                src={block.mediaUrl}
                alt={block.altText || block.title || 'Feature media'}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            {block.title && (
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#F5F2EB]">
                {block.title}
              </h3>
            )}
            {block.body && (
              <p className="text-sm text-[#8C8A84] leading-relaxed whitespace-pre-line">
                {block.body}
              </p>
            )}
          </div>
          {block.href && isSafeHref(block.href) && (
            <div className="pt-2">
              <ActionLink block={{ ...block, type: 'link' }} />
            </div>
          )}
        </article>
      );

    case 'stat':
      return (
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-2">
          <p className="font-serif text-4xl sm:text-5xl font-semibold text-[#D4B475] tabular-nums">
            {block.statValue || '—'}
          </p>
          {block.statLabel && (
            <p className="text-sm font-semibold text-[#F5F2EB]">{block.statLabel}</p>
          )}
          {block.body && <p className="text-xs text-[#8C8A84] leading-relaxed">{block.body}</p>}
        </div>
      );

    case 'image':
      if (!block.mediaUrl) return null;
      return (
        <figure className="space-y-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111114]">
            <img
              src={block.mediaUrl}
              alt={block.altText || block.title || 'Section illustration'}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-auto max-h-[540px] object-cover"
            />
          </div>
          {(block.title || block.body) && (
            <figcaption className="text-xs text-[#8C8A84]">
              {block.title && <span className="text-[#F5F2EB] font-medium">{block.title} — </span>}
              {block.body}
            </figcaption>
          )}
        </figure>
      );

    case 'video':
      if (!block.mediaUrl) return null;
      return (
        <figure className="space-y-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111114]">
            <video
              src={block.mediaUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[540px] bg-black"
            />
          </div>
          {(block.title || block.body) && (
            <figcaption className="text-xs text-[#8C8A84]">
              {block.title && <span className="text-[#F5F2EB] font-medium">{block.title} — </span>}
              {block.body}
            </figcaption>
          )}
        </figure>
      );

    case 'list':
      return (
        <div className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-3">
          {block.title && (
            <h3 className="font-serif text-xl font-semibold text-[#D4B475]">{block.title}</h3>
          )}
          <ul className="space-y-2 text-sm text-[#F5F2EB]/85">
            {(block.items || []).filter(Boolean).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#D4B475] mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'button':
    case 'link':
      return <ActionLink block={block} />;

    default:
      return null;
  }
}

interface DynamicSectionRendererProps {
  sections: WebsiteSectionItem[];
  spacing?: 'compact' | 'standard' | 'airy';
}

export function DynamicSectionRenderer({
  sections,
  spacing = 'standard',
}: DynamicSectionRendererProps) {
  const activeSections = sections
    .filter((s) => s.isVisible && s.status === 'published')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeSections.length === 0) return null;

  const padY =
    spacing === 'compact'
      ? 'py-14 lg:py-18'
      : spacing === 'airy'
      ? 'py-24 lg:py-36'
      : 'py-20 lg:py-28';

  return (
    <>
      {activeSections.map((section) => {
        const blocks = parseSectionBlocks(section.blocksJson);
        const bgClass =
          section.backgroundTone === 'charcoal'
            ? 'bg-[#111114]/65 border-y border-white/10'
            : section.backgroundTone === 'accent'
            ? 'bg-gradient-to-b from-[#D4B475]/8 via-[#111114]/70 to-transparent border-y border-[#D4B475]/25'
            : 'border-t border-white/10';

        const cardBlocks = blocks.filter((b) => b.type === 'card');
        const statBlocks = blocks.filter((b) => b.type === 'stat');
        const actionBlocks = blocks.filter((b) => b.type === 'button' || b.type === 'link');
        const mediaBlocks = blocks.filter((b) => b.type === 'image' || b.type === 'video');
        const bodyBlocks = blocks.filter(
          (b) => b.type === 'text' || b.type === 'list'
        );

        return (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className={`${padY} px-4 sm:px-6 lg:px-8 ${bgClass}`}
          >
            <div className="max-w-7xl mx-auto space-y-10">
              {(section.title || section.subtitle || section.description) && (
                <div className="max-w-3xl space-y-3">
                  {section.title && (
                    <SectionHeading
                      kicker={section.subtitle || 'Featured Section'}
                      title={section.title}
                      className="mb-2"
                    />
                  )}
                  {section.description && (
                    <p className="text-base text-[#F5F2EB]/80 leading-relaxed whitespace-pre-line">
                      {section.description}
                    </p>
                  )}
                </div>
              )}

              {/* Template-specific layouts backed safely by structured blocks */}
              {section.template === 'cta_banner' ? (
                <div className="p-8 sm:p-12 rounded-2xl bg-[#111114] border border-[#D4B475]/35 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    {bodyBlocks.map((b) => (
                      <RenderSingleBlock key={b.id} block={b} />
                    ))}
                  </div>
                  {actionBlocks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      {actionBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}
                </div>
              ) : section.template === 'media_showcase' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-6 space-y-5">
                    {bodyBlocks.map((b) => (
                      <RenderSingleBlock key={b.id} block={b} />
                    ))}
                    {actionBlocks.length > 0 && (
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        {actionBlocks.map((b) => (
                          <RenderSingleBlock key={b.id} block={b} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-6 space-y-5">
                    {mediaBlocks.map((b) => (
                      <RenderSingleBlock key={b.id} block={b} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {bodyBlocks.length > 0 && (
                    <div
                      className={`grid grid-cols-1 ${
                        bodyBlocks.length > 1 ? 'md:grid-cols-2' : ''
                      } gap-6`}
                    >
                      {bodyBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}

                  {statBlocks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {statBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}

                  {cardBlocks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cardBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}

                  {mediaBlocks.length > 0 && (
                    <div
                      className={`grid grid-cols-1 ${
                        mediaBlocks.length > 1 ? 'md:grid-cols-2' : ''
                      } gap-6`}
                    >
                      {mediaBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}

                  {actionBlocks.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4">
                      {actionBlocks.map((b) => (
                        <RenderSingleBlock key={b.id} block={b} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
