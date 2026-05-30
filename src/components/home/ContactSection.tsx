'use client';
import { useState } from 'react';

import { submitContactMessage } from '@/services/contactService';
import Button from '../ui/Button';

export default function ContactSection() {
  const [formData, setFormData] = useState({ studentName: '', studentEmail: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await submitContactMessage(formData);
      setFormData({ studentName: '', studentEmail: '', message: '' });
      setStatusMessage({ type: 'success', text: 'Message sent successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setStatusMessage({ type: 'error', text: 'Failed to send message. Please try again.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-white dark:bg-slate-900 py-20 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 right-0 h-[700px] overflow-hidden">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 700" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,200L60,190C120,180,240,160,360,150C480,140,600,140,720,155C840,170,960,200,1080,210C1200,220,1320,210,1380,205L1440,200L1440,700L1380,700C1320,700,1200,700,1080,700C960,700,840,700,720,700C600,700,480,700,360,700C240,700,120,700,60,700L0,700Z" fill="url(#gradient1-home)" style={{ animation: 'waveFloat 7s ease-in-out infinite' }} />
          <path d="M0,250L40,245C80,240,160,230,240,225C320,220,400,220,480,230C560,240,640,260,720,270C800,280,880,280,960,275C1040,270,1120,260,1200,255C1280,250,1360,250,1400,250L1440,250L1440,700L1400,700C1360,700,1280,700,1200,700C1120,700,1040,700,960,700,880,700,800,700,720,700,640,700,560,700,480,700,400,700,320,700,240,700,160,700,80,700,40,700L0,700Z" fill="url(#gradient2-home)" style={{ animation: 'waveFloat 9s ease-in-out infinite', animationDelay: '0.6s' }} />
          <path d="M0,300L50,295C100,290,200,280,300,275C400,270,500,270,600,280C700,290,800,310,900,320C1000,330,1100,330,1200,325C1300,320,1400,310,1450,305L1500,300L1500,700L1450,700C1400,700,1300,700,1200,700C1100,700,1000,700,900,700,800,700,700,700,600,700,500,700,400,700,300,700,200,700,100,700,50,700L0,700Z" fill="url(#gradient3-home)" style={{ animation: 'waveFloat 11s ease-in-out infinite', animationDelay: '1.2s' }} />
          <path d="M0,350L30,348C60,346,120,342,180,340C240,338,300,338,360,342C420,346,480,354,540,358C600,362,660,362,720,360C780,358,840,354,900,352C960,350,1020,350,1080,352C1140,354,1200,358,1260,360C1320,362,1380,362,1410,362L1440,362L1440,700L1410,700C1380,700,1320,700,1260,700,1200,700,1140,700,1080,700,1020,700,960,700,900,700,840,700,780,700,720,700,660,700,600,700,540,700,480,700,420,700,360,700C300,700,240,700,180,700,120,700,60,700,30,700L0,700Z" fill="url(#gradient4-home)" style={{ animation: 'waveFloat 13s ease-in-out infinite', animationDelay: '1.8s' }} />
          <defs>
            <linearGradient id="gradient1-home" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0.25" /></linearGradient>
            <linearGradient id="gradient2-home" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" /><stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" /></linearGradient>
            <linearGradient id="gradient3-home" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25" /><stop offset="100%" stopColor="#1e40af" stopOpacity="0.35" /></linearGradient>
            <linearGradient id="gradient4-home" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1e40af" stopOpacity="0.3" /><stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" /></linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
        <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 p-6 shadow-[0_0_80px_-10px_rgba(0,0,0,0.08),0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-800 sm:p-12 sm:rounded-2xl">
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl tracking-tight">Contact Us</h2>
            <p className="mt-4 text-sm sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto sm:mx-0">
              Have questions about your academic journey? Fill out the form below
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="studentName" className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Student Name</label>
                <input
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-slate-900 dark:text-slate-100 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="studentEmail" className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Student Email</label>
                <input
                  id="studentEmail"
                  name="studentEmail"
                  type="email"
                  value={formData.studentEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-slate-900 dark:text-slate-100 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                  placeholder="student@nu.edu.eg"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-2.5 block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Message</label>
              <textarea
                id="message"
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 text-slate-900 dark:text-slate-100 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none placeholder:text-slate-300"
                placeholder="How can we help you with your academic journey..."
              />
            </div>
            <div className="pt-4 flex flex-col items-center sm:items-start gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-10 py-5 rounded-full uppercase tracking-widest text-xs font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                {isSubmitting ? 'SUBMITTING...' : 'SEND MESSAGE'}
              </Button>
              {statusMessage && (
                <div className={`w-full rounded-xl p-4 text-sm font-bold text-center sm:text-left ${statusMessage.type === 'success' ? 'bg-green-50 dark:bg-emerald-950/40 text-green-600' : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300'}`}>
                  {statusMessage.text}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
