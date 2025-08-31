import React, { ReactNode } from 'react';
import { Quote as QuoteIcon } from 'lucide-react';

interface QuoteProps {
  text: ReactNode;
  author?: string;
  className?: string;
}

const Quote = ({ text, author, className = "" }: QuoteProps) => {
  return (
    <div className={`py-16 px-6 ${className}`}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative">
          <QuoteIcon className="w-12 h-12 text-primary mx-auto mb-6 opacity-60" />
          <blockquote className="text-2xl md:text-3xl font-light text-text-primary leading-relaxed italic mb-6">
            "{text}"
          </blockquote>
          {author && (
            <cite className="text-lg text-text-secondary font-medium">
              — {author}
            </cite>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quote;