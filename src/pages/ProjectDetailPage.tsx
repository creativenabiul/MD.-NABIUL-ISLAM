import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Code2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchPublicProjectBySlug } from '../lib/portfolioService';
import type { ProjectItem } from '../types/portfolio';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProjectCard } from '../components/ProjectCard';
import { MagneticButton } from '../components/MagneticButton';
import { ErrorBoundary } from '../components/ErrorBoundary';

const LazyProjectMockupCanvas = lazy(() =>
  import('../three/ProjectMockupCanvas').then((m) => ({ default: m.ProjectMockupCanvas }))
);

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = usePortfolio();
  const [project, setProject] = useState<ProjectItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    window.scrollTo(0, 0);

    const fromCache = data.projects.find((p) => p.slug === slug);
    if (fromCache) {
      setProject(fromCache);
      setLoading(false);
      return;
    }

    if (slug) {
      fetchPublicProjectBySlug(slug).then((found) => {
        if (!active) return;
        setProject(found);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [slug, data.projects]);

  const related = data.projects.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col">
      <Navbar brandName={data.profile.fullName} />

      <main className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#D4B475] hover:text-[#E8D2A0] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Projects
        </Link>

        {loading ? (
          <div className="py-24 text-center text-sm text-[#8C8A84]">Loading case study...</div>
        ) : !project ? (
          <div className="p-12 rounded-2xl bg-[#111114] border border-white/10 text-center space-y-4">
            <h1 className="font-serif text-3xl text-[#F5F2EB]">Project Not Found</h1>
            <p className="text-sm text-[#8C8A84]">
              This case study may have been moved or unpublished.
            </p>
            <MagneticButton to="/projects" variant="primary">
              Browse Portfolio
            </MagneticButton>
          </div>
        ) : (
          <article className="space-y-14">
            {/* Header */}
            <header className="space-y-4">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
                {project.category}
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#F5F2EB] leading-[1.08]">
                {project.title}
              </h1>
              <p className="text-lg text-[#F5F2EB]/80 max-w-3xl leading-relaxed">
                {project.shortDescription}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                {project.liveUrl && (
                  <MagneticButton href={project.liveUrl} variant="primary" cursorLabel="LIVE">
                    <span className="inline-flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4" />
                      Visit Live Project
                    </span>
                  </MagneticButton>
                )}
                {project.sourceUrl && (
                  <MagneticButton href={project.sourceUrl} variant="secondary" cursorLabel="CODE">
                    <span className="inline-flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" />
                      View Source Code
                    </span>
                  </MagneticButton>
                )}
              </div>
            </header>

            {/* 3D Interactive Laptop & Smartphone Mockup */}
            <section aria-label="Interactive 3D Device Showcase">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#D4B475]">
                  Interactive 3D Device Showcase
                </p>
                <span className="text-xs text-[#8C8A84]">Drag to rotate · Switch camera angles</span>
              </div>
              <ErrorBoundary
                fallback={
                  <div className="w-full h-[320px] rounded-2xl bg-[#111114] border border-white/10 overflow-hidden">
                    {project.coverImageUrl && (
                      <img
                        src={project.coverImageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="w-full h-[420px] rounded-2xl bg-[#111114] border border-white/10" />
                  }
                >
                  <LazyProjectMockupCanvas imageUrl={project.coverImageUrl} title={project.title} />
                </Suspense>
              </ErrorBoundary>
            </section>

            {/* Case Study Breakdown */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {[
                { label: 'Project Overview', text: project.overview },
                { label: 'Objective', text: project.objective },
                { label: 'Challenges', text: project.challenges },
                { label: 'Creative Approach', text: project.approach },
                { label: 'Design Process', text: project.designProcess },
                { label: 'Final Output', text: project.finalOutput },
              ]
                .filter((s) => s.text && s.text.trim().length > 0)
                .map((sec) => (
                  <div
                    key={sec.label}
                    className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-2.5"
                  >
                    <h2 className="font-serif text-2xl font-semibold text-[#D4B475]">
                      {sec.label}
                    </h2>
                    <p className="text-sm text-[#F5F2EB]/85 leading-relaxed whitespace-pre-line">
                      {sec.text}
                    </p>
                  </div>
                ))}
            </section>

            {/* Verified Results (only shown when explicitly supplied) */}
            {project.results && project.results.trim().length > 0 && (
              <section className="p-7 rounded-2xl bg-[#141418] border border-[#D4B475]/35">
                <h2 className="font-serif text-2xl font-semibold text-[#D4B475] mb-2">
                  Verified Outcome &amp; Impact
                </h2>
                <p className="text-base text-[#F5F2EB] leading-relaxed">{project.results}</p>
              </section>
            )}

            {/* Tools & Technologies */}
            {project.tools.length > 0 && (
              <section className="pt-6 border-t border-white/10">
                <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#8C8A84] mb-3">
                  Tools &amp; Technologies
                </h2>
                <p className="text-base text-[#F5F2EB]">{project.tools.join(' · ')}</p>
              </section>
            )}

            {/* Gallery */}
            {project.galleryImages.length > 0 && (
              <section className="space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-[#F5F2EB]">
                  Visual Gallery
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl overflow-hidden border border-white/10 bg-[#111114] aspect-[4/3]"
                    >
                      <img
                        src={imgUrl}
                        alt={`${project.title} gallery frame ${idx + 1}`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Projects */}
            {related.length > 0 && (
              <section className="pt-12 border-t border-white/10 space-y-6">
                <h2 className="font-serif text-3xl font-semibold text-[#F5F2EB]">
                  Related Case Studies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {related.map((rel) => (
                    <ProjectCard key={rel.id} project={rel} />
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Footer
        profile={data.profile}
        socialLinks={data.socialLinks}
        tagline={data.settings.tagline}
      />
    </div>
  );
}
