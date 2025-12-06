import React from 'react';
import type { InventoryItem, UserProfile } from '../../types';

interface InventoryWidgetProps {
  inventory: InventoryItem[];
  userProfile: UserProfile;
}

const roleToCategoryMap: Record<string, InventoryItem['category'] | 'All'> = {
    'IT Support': 'IT',
    'Maintenance': 'Maintenance',
    'Librarian': 'Library',
    'Bookstore and Uniform Attendant': 'Bookstore',
    'Day care Administrator': 'General',
    'Accountant': 'All',
    'Admin': 'All',
};

const InventoryWidget: React.FC<InventoryWidgetProps> = ({ inventory, userProfile }) => {
  const userCategory = roleToCategoryMap[userProfile.role] || 'General';
  
  const relevantItems = inventory.filter(item => userCategory === 'All' || item.category === userCategory);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl shadow-xl dark:border-slate-800/60 dark:bg-slate-900/40 col-span-1 md:col-span-2">
      <h3 className="font-bold text-slate-900 dark:text-white mb-3">Inventory Levels ({userCategory})</h3>
      <div className="max-h-64 overflow-y-auto pr-2">
        {relevantItems.length > 0 ? (
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-500/10">
              <tr>
                <th scope="col" className="px-4 py-2">Item</th>
                <th scope="col" className="px-4 py-2">Stock</th>
                <th scope="col" className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {relevantItems.map(item => {
                const isLowStock = item.stock <= item.low_stock_threshold;
                return (
                  <tr key={item.id} className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-500/10">
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-2">{item.stock} / {item.low_stock_threshold}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isLowStock ? 'bg-red-500/10 text-red-800 dark:text-red-300' : 'bg-green-500/10 text-green-800 dark:text-green-300'}`}>
                        {isLowStock ? 'Reorder' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">No inventory items to display for your role.</p>
        )}
      </div>
    </div>
  );
};

export default InventoryWidget;