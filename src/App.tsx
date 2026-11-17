import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { CustomCursor } from './components/CustomCursor';
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProfileAboutPage } from './pages/admin/AdminProfileAboutPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import {
  AdminServicesPage,
  AdminSkillsPage,
  AdminStatisticsPage,
  AdminExperiencePage,
  AdminEducationPage,
  AdminCertificationsPage,
  AdminTestimonialsPage,
} from './pages/admin/AdminModulesPages';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminMediaPage, AdminSettingsPage } from './pages/admin/AdminMediaSettingsPages';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function PublicCursorLayer() {
  const { data } = usePortfolio();
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  return <CustomCursor enabled={Boolean(data.settings.enableCustomCursor) && !isAdminRoute} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortfolioProvider>
          <ScrollToTop />
          <PublicCursorLayer />
          <Routes>
            {/* Public Portfolio Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Protected Admin Panel Routes */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/profile" element={<AdminProfileAboutPage />} />
            <Route path="/admin/projects" element={<AdminProjectsPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/skills" element={<AdminSkillsPage />} />
            <Route path="/admin/statistics" element={<AdminStatisticsPage />} />
            <Route path="/admin/experience" element={<AdminExperiencePage />} />
            <Route path="/admin/education" element={<AdminEducationPage />} />
            <Route path="/admin/certifications" element={<AdminCertificationsPage />} />
            <Route path="/admin/testimonials" element={<AdminTestimonialsPage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/admin/media" element={<AdminMediaPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortfolioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
