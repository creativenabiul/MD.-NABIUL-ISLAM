import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SectionHeading } from '../components/KineticTypography';
import { ProjectCard } from '../components/ProjectCard';

export function ProjectsPage() {
  const { data } = usePortfolio();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return data.projects.filter((proj) => {
      const catMatch = selectedCategory === 'All' || proj.category === selectedCategory;
      const textMatch =
        !q ||
        proj.title.toLowerCase().includes(q) ||
        proj.shortDescription.toLowerCase().includes(q) ||
        proj.tools.some((t) => t.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
  }, [data.projects, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col">
      <Navbar brandName={data.profile.fullName} />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <SectionHeading
          kicker="Portfolio Archive"
          title="Selected Projects &"
          outlinedWord="Case Studies."
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
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
            {data.categories.map((cat) => (
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

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-[#8C8A84] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects or tools..."
              aria-label="Search projects"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#111114] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#8C8A84] focus:outline-none focus:border-[#D4B475]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-14 rounded-2xl bg-[#111114] border border-white/10 text-center">
            <p className="font-serif text-2xl text-[#F5F2EB]">No matching projects found.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchTerm('');
              }}
              className="mt-4 text-sm text-[#D4B475] underline underline-offset-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
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
