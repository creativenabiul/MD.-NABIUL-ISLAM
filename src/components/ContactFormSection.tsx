import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, Mail, MapPin, Phone } from 'lucide-react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ProfileData, SocialLinkItem } from '../types/portfolio';
import { MagneticButton } from './MagneticButton';
import { SectionHeading } from './KineticTypography';

const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Please enter at least 2 characters').max(100, 'Maximum 100 characters'),
  email: z.string().trim().email('Please enter a valid email address').max(150),
  subject: z.string().trim().min(2, 'Please enter a subject').max(160, 'Maximum 160 characters'),
  message: z.string().trim().min(10, 'Please share at least 10 characters').max(3000, 'Maximum 3000 characters'),
  website: z.string().max(200).optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormSectionProps {
  profile: ProfileData;
  socialLinks: SocialLinkItem[];
}

export function ContactFormSection({ profile, socialLinks }: ContactFormSectionProps) {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    },
  });

  const activeSocials = socialLinks.filter((s) => s.isVisible && s.url.trim().length > 0);

  const submitDirectToFirestore = async (values: ContactFormValues) => {
    if (values.website && values.website.trim().length > 0) {
      return;
    }
    const clean = (s: string) => s.replace(/[<>]/g, '').trim();
    const docId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'contact_messages', docId), {
      name: clean(values.name),
      email: clean(values.email).toLowerCase(),
      subject: clean(values.subject),
      message: clean(values.message),
      status: 'unread',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitState('submitting');
    setFeedbackMsg('');
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const contentType = resp.headers.get('content-type') || '';
      if (resp.status === 404 || resp.status === 405 || !contentType.includes('application/json')) {
        await submitDirectToFirestore(values);
        setSubmitState('success');
        setFeedbackMsg('Thank you. Your inquiry has been received.');
        reset();
        return;
      }
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        setSubmitState('error');
        setFeedbackMsg(data.message || 'Unable to send your inquiry right now. Please try again.');
        return;
      }
      setSubmitState('success');
      setFeedbackMsg(data.message || 'Thank you. Your inquiry has been received.');
      reset();
    } catch {
      try {
        await submitDirectToFirestore(values);
        setSubmitState('success');
        setFeedbackMsg('Thank you. Your inquiry has been received.');
        reset();
      } catch {
        setSubmitState('error');
        setFeedbackMsg('Network error. Please try again or reach out directly via email.');
      }
    }
  };

  return (
    <section id="contact" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <SectionHeading
        kicker="Inquiries"
        title="Let's Create Something"
        outlinedWord="Meaningful Together."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Details */}
        <div className="lg:col-span-5 space-y-8">
          <p className="text-base text-[#F5F2EB]/85 leading-relaxed">
            I&apos;m open to freelance design projects, creative collaborations, and professional opportunities. Let&apos;s discuss how we can turn your ideas into something impactful.
          </p>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <a
              href={`mailto:${profile.email}`}
              className="flex items-start gap-3.5 text-sm text-[#F5F2EB]/90 hover:text-[#D4B475] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#D4B475] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-[#8C8A84]">Email</p>
                <p className="mt-0.5 font-medium">{profile.email}</p>
              </div>
            </a>

            <a
              href={`tel:${profile.phone}`}
              className="flex items-start gap-3.5 text-sm text-[#F5F2EB]/90 hover:text-[#D4B475] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#D4B475] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-[#8C8A84]">Phone</p>
                <p className="mt-0.5 font-medium tabular-nums">{profile.phone}</p>
              </div>
            </a>

            <div className="flex items-start gap-3.5 text-sm text-[#F5F2EB]/90">
              <MapPin className="w-4 h-4 text-[#D4B475] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-[#8C8A84]">Location</p>
                <p className="mt-0.5 font-medium">{profile.location}</p>
              </div>
            </div>
          </div>

          {activeSocials.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-[#8C8A84] mb-3">Social Profiles</p>
              <div className="flex flex-wrap gap-4">
                {activeSocials.map((soc) => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm font-medium text-[#D4B475] hover:text-[#E8D2A0] underline underline-offset-4"
                  >
                    {soc.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#111114] border border-white/10">
          {submitState === 'success' ? (
            <div className="py-12 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#D4B475] mx-auto" />
              <h3 className="font-serif text-2xl font-semibold text-[#F5F2EB]">
                Message Received
              </h3>
              <p className="text-sm text-[#8C8A84] max-w-md mx-auto">{feedbackMsg}</p>
              <button
                type="button"
                onClick={() => setSubmitState('idle')}
                className="mt-4 inline-flex items-center px-5 py-2.5 rounded-lg border border-white/15 text-xs font-medium text-[#F5F2EB] hover:border-[#D4B475]"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Honeypot Anti-Spam Field */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register('website')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-[#F5F2EB]/80 mb-2">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Full name"
                    {...register('name')}
                    className="w-full px-4 py-3 rounded-lg bg-[#070708] border border-white/12 text-sm text-[#F5F2EB] placeholder:text-[#8C8A84]/60 focus:outline-none focus:border-[#D4B475]"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-medium text-[#F5F2EB]/80 mb-2">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="you@domain.com"
                    {...register('email')}
                    className="w-full px-4 py-3 rounded-lg bg-[#070708] border border-white/12 text-sm text-[#F5F2EB] placeholder:text-[#8C8A84]/60 focus:outline-none focus:border-[#D4B475]"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-rose-400">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-medium text-[#F5F2EB]/80 mb-2">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  placeholder="Project inquiry, brand identity, or automation workflow"
                  {...register('subject')}
                  className="w-full px-4 py-3 rounded-lg bg-[#070708] border border-white/12 text-sm text-[#F5F2EB] placeholder:text-[#8C8A84]/60 focus:outline-none focus:border-[#D4B475]"
                />
                {errors.subject && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-[#F5F2EB]/80 mb-2">
                  Project Details
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Share your goals, timeline, and scope..."
                  {...register('message')}
                  className="w-full px-4 py-3 rounded-lg bg-[#070708] border border-white/12 text-sm text-[#F5F2EB] placeholder:text-[#8C8A84]/60 focus:outline-none focus:border-[#D4B475] resize-y"
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.message.message}</p>
                )}
              </div>

              {submitState === 'error' && feedbackMsg && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              <div className="pt-2">
                <MagneticButton
                  type="submit"
                  variant="primary"
                  disabled={submitState === 'submitting'}
                  cursorLabel="SEND"
                >
                  {submitState === 'submitting' ? 'Sending Inquiry...' : 'Send Message'}
                </MagneticButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
