import { Link } from 'react-router-dom';
import type { ProfileData, SocialLinkItem } from '../types/portfolio';

interface FooterProps {
  profile: ProfileData;
  socialLinks: SocialLinkItem[];
  tagline?: string;
}

export function Footer({
  profile,
  socialLinks,
  tagline = 'Creative Thinking. Strategic Design. Intelligent Automation.',
}: FooterProps) {
  const activeSocials = socialLinks.filter((s) => s.isVisible && s.url.trim().length > 0);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#070708] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          <div>
            <Link to="/" className="font-serif text-2xl font-semibold text-[#F5F2EB]">
              {profile.fullName}
            </Link>
            <p className="mt-3 text-sm text-[#8C8A84] leading-relaxed max-w-sm">
              {tagline}
            </p>
            <p className="mt-2 text-xs text-[#8C8A84]/80">{profile.location}</p>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475] mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F5F2EB]/75">
              <li>
                <Link to="/" className="hover:text-[#D4B475] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#D4B475] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-[#D4B475] transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D4B475] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475] mb-4">
              Direct Channels
            </h3>
            <ul className="space-y-2 text-sm text-[#F5F2EB]/80">
              <li>
                <a href={`mailto:${profile.email}`} className="hover:text-[#D4B475] transition-colors">
                  {profile.email}
                </a>
              </li>
              <li>
                <a href={`tel:${profile.phone}`} className="hover:text-[#D4B475] transition-colors tabular-nums">
                  {profile.phone}
                </a>
              </li>
            </ul>

            {activeSocials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {activeSocials.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4 transition-colors"
                  >
                    {soc.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex items-center justify-between gap-4 text-xs text-[#8C8A84]">
          <p>
            © {year} {profile.fullName}. All rights reserved.
          </p>
          <Link
            to="/admin"
            className="text-[11px] text-[#8C8A84]/45 hover:text-[#8C8A84] transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
