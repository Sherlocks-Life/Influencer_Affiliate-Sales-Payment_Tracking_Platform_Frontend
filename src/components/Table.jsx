import React from 'react';
import { twMerge } from 'tailwind-merge';

const Table = ({ headers, children, className, isLoading = false, emptyMessage = 'No data available' }) => {
  return (
    <div className={twMerge('w-full overflow-x-auto rounded-xl border border-slate-100', className)}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50 sticky top-0">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {headers.map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-500 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
