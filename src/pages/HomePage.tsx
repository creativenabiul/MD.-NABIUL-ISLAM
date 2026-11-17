import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink, Award, GraduationCap, Briefcase } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { MagneticButton } from '../components/MagneticButton';
import {
  HeroKineticHeadline,
  ScrollRevealParagraph,
  SectionHeading,
  SkillsMarquee,
} from '../components/KineticTypography';
import { AnimatedCounter, SkillMeter } from '../components/AnimatedCounter';
import { ProjectCard } from '../components/ProjectCard';
import { ScrollScrubVideo } from '../components/ScrollScrubVideo';
import { TestimonialCarousel } from '../components/TestimonialCarousel';
import { ContactFormSection } from '../components/ContactFormSection';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const LazyHeroCanvas = lazy(() =>
  import('../three/HeroCanvas').then((m) => ({ default: m.HeroCanvas }))
);

export function HomePage() {
  const { data } = usePortfolio();
  const {
    profile,
    about,
    services,
    skills,
    statistics,
    experiences,
    education,
    categories,
    projects,
    certifications,
    achievements,
    testimonials,
    socialLinks,
    settings,
  } = data;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [portraitFailed, setPortraitFailed] = useState(false);

  const visibleStats = useMemo(
    () => statistics.filter((s) => s.isVisible && s.value !== null && s.value !== undefined),
    [statistics]
  );

  const skillCategories = useMemo(() => {
    const map = new Map<string, typeof skills>();
    skills.forEach((sk) => {
      const list = map.get(sk.category) || [];
      list.push(sk);
      map.set(sk.category, list);
    });
    return Array.from(map.entries());
  }, [skills]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const headlineLines = useMemo(() => {
    return ['Designing Brands.', 'Scaling Strategy.', 'Automating Impact.'];
  }, []);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB]">
      <Navbar brandName={profile.fullName} />

      {/* A. HERO SECTION WITH 3D CANVAS */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
      >
        {/* 3D Interactive Scene Backdrop */}
        <div className="absolute inset-0 z-0">
          <Suspense
            fallback={
              <div className="w-full h-full bg-[#070708]" />
            }
          >
            <LazyHeroCanvas enabled={settings.enable3D} />
          </Suspense>
          {/* Contrast scrim for left-column typography legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#070708]/92 via-[#070708]/68 to-transparent pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#070708] to-transparent pointer-events-none"
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              {profile.isAvailable && (
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
                  {profile.availability}
                </p>
              )}

              <div>
                <p className="text-sm sm:text-base font-medium text-[#E8D2A0] mb-3">
                  {profile.fullName} · {profile.headline}
                </p>
                <HeroKineticHeadline
                  lines={headlineLines}
                  className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-semibold tracking-tight text-[#F5F2EB] leading-[1.06]"
                />
              </div>

              <p className="text-base sm:text-lg text-[#F5F2EB]/80 leading-relaxed max-w-2xl">
                {profile.heroDescription}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <MagneticButton
                  href="#projects"
                  variant="primary"
                  cursorLabel="EXPLORE"
                >
                  Explore My Work
                </MagneticButton>

                <MagneticButton
                  to="/contact"
                  variant="secondary"
                  cursorLabel="CONTACT"
                >
                  Contact Me
                </MagneticButton>

                {profile.cvUrl && (
                  <a
                    href={profile.cvUrl}
                    download={profile.cvFilename || 'Md_Nabiul_Islam_CV.pdf'}
                    className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Download CV
                  </a>
                )}
              </div>

              <div className="pt-4 text-xs text-[#8C8A84] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{profile.location}</span>
                <span aria-hidden="true">·</span>
                <span>{profile.email}</span>
              </div>
            </div>

            {/* Right Column: Subtle Editorial Portrait Card positioned cleanly without occluding 3D typography */}
            <div className="lg:col-span-5 flex lg:justify-end">
              <div className="relative w-full max-w-[320px] sm:max-w-[340px] rounded-2xl overflow-hidden border border-white/15 bg-[#111114]/80 backdrop-blur-sm">
                <div className="aspect-[3/4] w-full overflow-hidden bg-[#141418]">
                  {profile.profileImageUrl && !portraitFailed ? (
                    <img
                      src={profile.profileImageUrl}
                      alt={profile.fullName}
                      referrerPolicy="no-referrer"
                      onError={() => setPortraitFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif text-4xl text-[#D4B475]">
                      NI
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg font-semibold text-[#F5F2EB]">
                      {profile.fullName}
                    </p>
                    <p className="text-xs text-[#8C8A84]">Gaibandha, Bangladesh</p>
                  </div>
                  <span className="text-[11px] font-mono text-[#D4B475] whitespace-nowrap">
                    B.Sc Chemistry
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE WITH SCROLL-VELOCITY SKEW */}
      <SkillsMarquee text={settings.marqueeText} />

      {/* E. VERIFIED STATISTICS STRIP (Hidden if empty) */}
      {visibleStats.length > 0 && (
        <section aria-label="Verified Portfolio Overview" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleStats.map((stat, idx) => (
              <AnimatedCounter
                key={stat.id}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                description={stat.description}
                delayMs={idx * 90}
              />
            ))}
          </div>
        </section>
      )}

      {/* B. ABOUT SECTION */}
      <section id="about" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <SectionHeading
          kicker="Background & Philosophy"
          title="Creativity Rooted in"
          outlinedWord="Scientific Precision."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-5">
            <div className="h-full min-h-[360px] rounded-2xl overflow-hidden border border-white/10 bg-[#111114]">
              <img
                src={about.portraitImageUrl || profile.profileImageUrl}
                alt={`${profile.fullName} portrait`}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <ScrollRevealParagraph
                text={about.introduction}
                className="font-serif text-2xl sm:text-3xl leading-snug"
              />
              <p className="text-base text-[#F5F2EB]/75 leading-relaxed">
                {about.background}
              </p>
              <p className="text-base text-[#D4B475] font-medium leading-relaxed">
                {about.careerObjective}
              </p>
            </div>

            <div className="pt-6 border-t border-white/10">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#8C8A84] mb-3">
                Core Interests & Focus
              </p>
              <p className="text-sm text-[#F5F2EB]/85 leading-relaxed">
                {about.interests.join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {profile.cvUrl && (
                <MagneticButton
                  href={profile.cvUrl}
                  download={profile.cvFilename || 'Md_Nabiul_Islam_CV.pdf'}
                  variant="primary"
                  cursorLabel="PDF"
                >
                  Download Full CV
                </MagneticButton>
              )}
              <Link
                to="/about"
                className="text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4"
              >
                Read Full Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* C. SERVICES SECTION */}
      <section id="services" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <SectionHeading
          kicker="Capabilities"
          title="Services & Creative"
          outlinedWord="Disciplines."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <article
              key={service.id}
              className="p-7 rounded-2xl bg-[#111114] border border-white/10 hover:border-[#D4B475]/45 transition-colors flex flex-col justify-between gap-6"
            >
              <div>
                <p className="text-xs font-mono tabular-nums text-[#D4B475]">
                  {String(idx + 1).padStart(2, '0')}.
                </p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-[#F5F2EB]">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="mt-2.5 text-sm text-[#8C8A84] leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>

              <ul className="pt-4 border-t border-white/8 space-y-1.5 text-sm text-[#F5F2EB]/85">
                {service.deliverables.map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[#D4B475] shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* SCROLL-SCRUBBED MP4 SHOWCASE SECTION */}
      <ScrollScrubVideo
        videoUrl={settings.showcaseVideoUrl}
        posterUrl={settings.showcasePosterUrl}
        tagline={settings.tagline}
      />

      {/* D. SKILLS MATRIX */}
      <section id="skills" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <SectionHeading
          kicker="Proficiencies"
          title="Tools, Strategy &"
          outlinedWord="Technical Stack."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillCategories.map(([category, items]) => (
            <div
              key={category}
              className="p-6 rounded-2xl bg-[#111114] border border-white/10"
            >
              <h3 className="font-serif text-xl font-semibold text-[#D4B475] pb-3 mb-2 border-b border-white/10">
                {category}
              </h3>
              <div>
                {items.map((sk) => (
                  <SkillMeter
                    key={sk.id}
                    name={sk.name}
                    proficiencyLabel={sk.proficiencyLabel}
                    level={sk.level}
                    hasLevel={sk.hasLevel}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* H. PROJECTS PORTFOLIO GRID */}
      <section id="projects" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <SectionHeading
            kicker="Selected Works"
            title="Case Studies &"
            outlinedWord="Deliverables."
            className="mb-0"
          />

          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#111114] border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-[#D4B475] text-[#070708]'
                  : 'text-[#8C8A84] hover:text-[#F5F2EB]'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat.name
                    ? 'bg-[#D4B475] text-[#070708]'
                    : 'text-[#8C8A84] hover:text-[#F5F2EB]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#111114] border border-white/10 text-center">
            <p className="font-serif text-2xl text-[#F5F2EB]">
              No published case studies in {selectedCategory} yet.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="mt-4 text-sm text-[#D4B475] underline underline-offset-4"
            >
              Show All Projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                featuredSpan={index === 0 && filteredProjects.length > 2 && selectedCategory === 'All'}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <MagneticButton to="/projects" variant="secondary" cursorLabel="ARCHIVE">
            View Full Archive
          </MagneticButton>
        </div>
      </section>

      {/* F & G. EXPERIENCE & EDUCATION TIMELINES */}
      <section id="experience" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <SectionHeading
          kicker="Trajectory"
          title="Experience &"
          outlinedWord="Academic Foundation."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Experience Column */}
          <div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-[#D4B475] mb-6">
              <Briefcase className="w-4 h-4" />
              <span>Experience &amp; Technical Training</span>
            </div>
            <div className="space-y-6 border-l border-white/12 pl-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#D4B475] border-2 border-[#070708]"
                  />
                  <p className="text-xs font-mono text-[#D4B475]">
                    {[exp.period, exp.context].filter(Boolean).join(' · ')}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-[#F5F2EB]">
                    {exp.role}
                  </h3>
                  <p className="text-sm text-[#F5F2EB]/80">{exp.organization}</p>
                  {exp.description && (
                    <p className="mt-2 text-sm text-[#8C8A84] leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Education Column */}
          <div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-[#D4B475] mb-6">
              <GraduationCap className="w-4 h-4" />
              <span>Academic Education</span>
            </div>
            <div className="space-y-6 border-l border-white/12 pl-6">
              {education.map((edu) => (
                <div key={edu.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#D4B475] border-2 border-[#070708]"
                  />
                  <p className="text-xs font-mono text-[#D4B475]">
                    {[edu.period, edu.focus].filter(Boolean).join(' · ')}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold text-[#F5F2EB]">
                    {edu.degree}
                  </h3>
                  <p className="text-sm text-[#8C8A84]">{edu.institution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* I & J. CERTIFICATIONS & ACHIEVEMENTS */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
          <SectionHeading
            kicker="Credentials & Recognition"
            title="Certifications &"
            outlinedWord="Achievements."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {certifications.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[#D4B475] mb-4">
                  Accredited Programs &amp; Certifications
                </h3>
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-serif text-xl font-semibold text-[#F5F2EB]">
                        {cert.name}
                      </h4>
                      {cert.issueDate && (
                        <span className="text-xs font-mono text-[#D4B475] shrink-0">
                          {cert.issueDate}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#8C8A84]">{cert.organization}</p>
                    {cert.credentialId && (
                      <p className="text-xs font-mono text-[#8C8A84]">
                        Credential ID: {cert.credentialId}
                      </p>
                    )}
                    {cert.verificationUrl && (
                      <a
                        href={cert.verificationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4B475] hover:underline pt-1"
                      >
                        Verify Credential
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {achievements.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[#D4B475] mb-4">
                  Awards &amp; Leadership
                </h3>
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="p-6 rounded-2xl bg-[#111114] border border-white/10 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <Award className="w-4 h-4 text-[#D4B475] shrink-0" />
                        <h4 className="font-serif text-xl font-semibold text-[#F5F2EB]">
                          {ach.title}
                        </h4>
                      </div>
                      {ach.year && (
                        <span className="text-xs font-mono text-[#D4B475] shrink-0">
                          {ach.year}
                        </span>
                      )}
                    </div>
                    {ach.organization && (
                      <p className="text-xs text-[#E8D2A0]/80">{ach.organization}</p>
                    )}
                    <p className="text-sm text-[#8C8A84] leading-relaxed">{ach.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* K. TESTIMONIALS (Automatically hidden when none are published) */}
      <TestimonialCarousel testimonials={testimonials} />

      {/* L. CONTACT SECTION */}
      <ContactFormSection profile={profile} socialLinks={socialLinks} />

      {/* M. FOOTER */}
      <Footer profile={profile} socialLinks={socialLinks} tagline={settings.tagline} />
    </div>
  );
}
