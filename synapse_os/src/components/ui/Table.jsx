import React from 'react';
import { cn } from '../../lib/utils';

const Table = ({ headers, children, className }) => {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700/50 text-slate-400 text-sm">
            {headers.map((header, idx) => (
              <th key={idx} className="pb-3 font-medium px-4 first:pl-0 last:pr-0">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-200 text-sm">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

export const TableRow = ({ children, className }) => (
    <tr className={cn("border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors last:border-0", className)}>
        {children}
    </tr>
);

export const TableCell = ({ children, className }) => (
    <td className={cn("py-4 px-4 first:pl-0 last:pr-0", className)}>
        {children}
    </td>
);
