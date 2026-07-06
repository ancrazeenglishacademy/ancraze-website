import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Ancraze English Academy',
  description: 'Privacy Policy for Ancraze English Academy mobile application and website.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-purple-900 px-8 py-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Ancraze English Academy</h1>
          <p className="text-purple-200">Privacy Policy</p>
        </div>

        {/* Content */}
        <div className="px-8 py-10 space-y-8 text-gray-600">
          <div>
            <p className="text-sm text-gray-400 mb-6 font-medium">Last Updated: July 2026</p>
            <p className="leading-relaxed">
              Welcome to Ancraze English Academy. We are committed to protecting your personal information and your right to privacy. 
              This policy applies to all information collected through our mobile application and website.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Our Services</h2>
            <p className="leading-relaxed">
              Ancraze provides premium English academic courses featuring comprehensive modules and video lessons. Our goal is to enhance your learning experience through structured, high-quality digital content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="leading-relaxed">
              We do not collect any personal data or usage information directly from our app. Your student account is pre-provisioned securely by your educational administrator, and the app serves exclusively as a platform to access your educational content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Privacy and Security</h2>
            <p className="leading-relaxed">
              Since we do not collect data from you via the app, you can learn with peace of mind. Your pre-existing account details are managed securely off-app by your institution to grant you access to course modules and video lessons.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Contact Us</h2>
            <p className="leading-relaxed mb-6">
              If you have questions or comments about this notice, you may email us or visit our website.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a 
                href="mailto:ancrazeenglishacademy@gmail.com" 
                className="flex items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors duration-200 group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center mr-4 group-hover:bg-purple-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">Email Support</p>
                  <p className="text-sm font-medium text-purple-700">ancrazeenglishacademy@gmail.com</p>
                </div>
              </a>

              <a 
                href="https://ancraze.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors duration-200 group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center mr-4 group-hover:bg-purple-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">Our Website</p>
                  <p className="text-sm font-medium text-purple-700">ancraze.com</p>
                </div>
              </a>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center">
          <Link href="/" className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
            &larr; Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}
