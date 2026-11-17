import { usePortfolio } from '../context/PortfolioContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ContactFormSection } from '../components/ContactFormSection';

export function ContactPage() {
  const { data } = usePortfolio();

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex flex-col">
      <Navbar brandName={data.profile.fullName} />
      <main className="flex-1 pt-20">
        <ContactFormSection profile={data.profile} socialLinks={data.socialLinks} />
      </main>
      <Footer
        profile={data.profile}
        socialLinks={data.socialLinks}
        tagline={data.settings.tagline}
      />
    </div>
  );
}
