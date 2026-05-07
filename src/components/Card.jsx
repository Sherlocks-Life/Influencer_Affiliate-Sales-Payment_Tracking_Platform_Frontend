import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, title, subtitle, footer, noPadding = false }) => {
  return (
    <div className={twMerge('glass-card rounded-2xl overflow-hidden', className)}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={twMerge(noPadding ? '' : 'p-6')}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
