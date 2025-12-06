import React from 'react';
import type { RoleDetails } from '../types';
import { ShieldIcon } from './common/icons';

interface RoleDirectoryViewProps {
  roles: RoleDetails[];
}

const RoleDirectoryView: React.FC<RoleDirectoryViewProps> = ({ roles }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <ShieldIcon className="w-8 h-8 mr-3 text-sky-600"/>
            Role Directory
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">A complete list of all roles defined in the system and their associated permissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.sort((a, b) => a.title.localeCompare(b.title)).map(role => (
          <div key={role.title} className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 flex flex-col">
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{role.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 min-h-[3rem]">{role.description}</p>
              
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Reporting Quota</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {role.reportingQuotaCount && role.reportingQuotaDays
                    ? `${role.reportingQuotaCount} reports / ${role.reportingQuotaDays} days`
                    : 'Not set'}
                </p>
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Permissions</h4>
                <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto pr-1">
                  {role.permissions[0] === '*' ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-800 dark:text-green-300">All Permissions</span>
                  ) : (
                    role.permissions.map(p => <span key={p} className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-500/20 text-slate-700 dark:text-slate-300">{p}</span>)
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleDirectoryView;