import { Download, Award, Briefcase, GraduationCap } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import type { AboutInfoBlock } from '../types/portfolio';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SectionHeading, ScrollRevealParagraph } from '../components/KineticTypography';
import { MagneticButton } from '../components/MagneticButton';

function parseAboutBlocks(raw?: string): AboutInfoBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((b) => b && (b.heading || b.body)) : [];
  } catch {
    return [];
  }
}

export function AboutPage() {
  const { data } = usePortfolio();
  const { profile, about, experiences, education, certifications, achievements, socialLinks, settings } =
    data;
  const extraBlocks = parseAboutBlocks(about.additionalBlocksJson);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col">
      <Navbar brandName={profile.fullName} />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-20">
        <section>
          <SectionHeading
            kicker="About"
            title={profile.fullName}
            outlinedWord="Design, Strategy & Chemistry."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#111114] aspect-[3/4]">
                <img
                  src={about.portraitImageUrl || profile.profileImageUrl}
                  alt={profile.fullName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <ScrollRevealParagraph
                text={about.introduction}
                className="font-serif text-2xl sm:text-3xl leading-snug"
              />
              <p className="text-base text-[#F5F2EB]/80 leading-relaxed">{about.background}</p>
              {about.journey && (
                <p className="text-base text-[#F5F2EB]/80 leading-relaxed">{about.journey}</p>
              )}
              <p className="text-base text-[#D4B475] font-medium leading-relaxed">
                {about.careerObjective}
              </p>

              {extraBlocks.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {extraBlocks.map((blk) => (
                    <div key={blk.id} className="p-4 rounded-xl bg-[#111114] border border-white/10 space-y-1.5">
                      {blk.heading && (
                        <h3 className="font-serif text-lg font-semibold text-[#D4B475]">
                          {blk.heading}
                        </h3>
                      )}
                      {blk.body && <p className="text-xs text-[#F5F2EB]/80 leading-relaxed">{blk.body}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-white/10 space-y-2 text-sm text-[#8C8A84]">
                <p>Location: {profile.location}</p>
                <p>Availability: {profile.availability}</p>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                {profile.cvUrl && profile.cvVisible !== false && (
                  <MagneticButton
                    href={profile.cvUrl}
                    download={profile.cvFilename || 'Md_Nabiul_Islam_CV.pdf'}
                    variant="primary"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      {profile.cvButtonText || 'Download CV'}
                    </span>
                  </MagneticButton>
                )}
                <MagneticButton to="/contact" variant="secondary">
                  Get in Touch
                </MagneticButton>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-white/10">
          <div>
            <h2 className="flex items-center gap-2.5 text-sm font-medium text-[#D4B475] mb-6">
              <Briefcase className="w-4 h-4" />
              Experience &amp; Technical Training
            </h2>
            <div className="space-y-6 border-l border-white/12 pl-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative">
                  <span className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#D4B475]" />
                  <p className="text-xs font-mono text-[#D4B475]">
                    {[exp.period, exp.context].filter(Boolean).join(' · ')}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold">{exp.role}</h3>
                  <p className="text-sm text-[#F5F2EB]/80">{exp.organization}</p>
                  {exp.description && (
                    <p className="mt-1.5 text-sm text-[#8C8A84]">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-2.5 text-sm font-medium text-[#D4B475] mb-6">
              <GraduationCap className="w-4 h-4" />
              Education
            </h2>
            <div className="space-y-6 border-l border-white/12 pl-6">
              {education.map((edu) => (
                <div key={edu.id} className="relative">
                  <span className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#D4B475]" />
                  <p className="text-xs font-mono text-[#D4B475]">
                    {[edu.period, edu.focus].filter(Boolean).join(' · ')}
                  </p>
                  <h3 className="mt-1 font-serif text-xl font-semibold">{edu.degree}</h3>
                  <p className="text-sm text-[#8C8A84]">{edu.institution}</p>
                  {edu.result && (
                    <p className="mt-1 text-xs font-mono text-[#E8D2A0]/85">{edu.result}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {(achievements.length > 0 || certifications.length > 0) && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-12 border-t border-white/10">
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-[#D4B475]">Certifications</h2>
              {certifications.map((cert) => (
                <div key={cert.id} className="p-5 rounded-2xl bg-[#111114] border border-white/10">
                  <h3 className="font-serif text-xl font-semibold">{cert.name}</h3>
                  <p className="text-sm text-[#8C8A84] mt-1">{cert.organization}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-medium text-[#D4B475]">Achievements</h2>
              {achievements.map((ach) => (
                <div key={ach.id} className="p-5 rounded-2xl bg-[#111114] border border-white/10">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#D4B475]" />
                    <h3 className="font-serif text-xl font-semibold">{ach.title}</h3>
                  </div>
                  <p className="text-sm text-[#8C8A84] mt-1.5">{ach.details}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer profile={profile} socialLinks={socialLinks} tagline={settings.tagline} />
    </div>
  );
}
