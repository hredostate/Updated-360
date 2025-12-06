import React, { useState } from 'react';
import type { RewardStoreItem, Student, UserProfile } from '../types';
import Spinner from './common/Spinner';
import SearchableSelect from './common/SearchableSelect';

// --- Modals for Reward Management ---

interface AddEditRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reward: Partial<RewardStoreItem>) => Promise<boolean>;
    reward?: RewardStoreItem;
}

const AddEditRewardModal: React.FC<AddEditRewardModalProps> = ({ isOpen, onClose, onSave, reward }) => {
    const [name, setName] = useState(reward?.name || '');
    const [description, setDescription] = useState(reward?.description || '');
    const [cost, setCost] = useState(reward?.cost || '');
    const [stock, setStock] = useState(reward?.stock || '');
    const [icon, setIcon] = useState(reward?.icon || '🎁');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const success = await onSave({
            id: reward?.id,
            name,
            description,
            cost: Number(cost),
            stock: Number(stock),
            icon,
        });
        if (success) onClose();
        setIsSaving(false);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-lg m-4 space-y-4">
                <h2 className="text-xl font-bold">{reward ? 'Edit' : 'Add'} Reward</h2>
                <input type="text" placeholder="Reward Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded-md" />
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-md" />
                <div className="grid grid-cols-3 gap-4">
                    <input type="number" placeholder="Cost (points)" value={cost} onChange={e => setCost(e.target.value)} required className="w-full p-2 border rounded-md" />
                    <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} required className="w-full p-2 border rounded-md" />
                    <input type="text" placeholder="Icon (emoji)" value={icon} onChange={e => setIcon(e.target.value)} required className="w-full p-2 border rounded-md text-center" />
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-md">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center min-w-[80px] justify-center">{isSaving ? <Spinner size="sm"/> : 'Save'}</button>
                </div>
            </form>
        </div>
    );
};


interface RedeemRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRedeem: (studentId: number, rewardId: number) => Promise<boolean>;
    reward: RewardStoreItem;
    students: Student[];
}

const RedeemRewardModal: React.FC<RedeemRewardModalProps> = ({ isOpen, onClose, onRedeem, reward, students }) => {
    const [studentId, setStudentId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const selectedStudent = students.find(s => s.id === studentId);
    const canAfford = selectedStudent ? selectedStudent.reward_points >= reward.cost : false;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !canAfford) return;
        setIsSaving(true);
        const success = await onRedeem(studentId, reward.id);
        if (success) onClose();
        setIsSaving(false);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-xl shadow-2xl dark:border-slate-800/60 dark:bg-slate-900/80 w-full max-w-md m-4 space-y-4">
                <h2 className="text-xl font-bold">Redeem: {reward.name}</h2>
                <p>Cost: <span className="font-bold">{reward.cost} points</span></p>
                <div>
                    <label className="block text-sm font-medium">Select Student</label>
                    <SearchableSelect
                        options={students.map(s => ({ value: s.id, label: `${s.name} (${s.reward_points} points)` }))}
                        value={studentId}
                        onChange={value => setStudentId(value as number)}
                        placeholder="-- Select a student --"
                    />
                </div>
                {selectedStudent && (
                    <div className={`p-2 rounded-md text-sm ${canAfford ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {canAfford ? `Sufficient points. New balance will be ${selectedStudent.reward_points - reward.cost}.` : 'Insufficient points.'}
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose}>Cancel</button>
                    <button type="submit" disabled={isSaving || !canAfford} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300 flex items-center min-w-[100px] justify-center">{isSaving ? <Spinner size="sm"/> : 'Redeem'}</button>
                </div>
            </form>
        </div>
    );
};


// --- Main Component ---

interface RewardsStoreViewProps {
  rewards: RewardStoreItem[];
  students: Student[];
  userProfile: UserProfile;
  userPermissions: string[];
  onSaveReward: (rewardData: Partial<RewardStoreItem>) => Promise<boolean>;
  onDeleteReward: (rewardId: number) => Promise<boolean>;
  onRedeemReward: (studentId: number, rewardId: number) => Promise<boolean>;
}

const RewardsStoreView: React.FC<RewardsStoreViewProps> = ({ rewards, students, userProfile, userPermissions, onSaveReward, onDeleteReward, onRedeemReward }) => {
  const [editingReward, setEditingReward] = useState<RewardStoreItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState<RewardStoreItem | null>(null);

  const canManage = ['Admin', 'Principal'].includes(userProfile.role);

  const handleOpenEditModal = (reward?: RewardStoreItem) => {
    setEditingReward(reward || null);
    setIsEditModalOpen(true);
  };
  
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rewards Store</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">Redeem points for student rewards.</p>
            </div>
            {canManage && <button onClick={() => handleOpenEditModal()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Add Reward Item</button>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rewards.map(reward => (
                <div key={reward.id} className="relative rounded-xl border border-slate-200/60 bg-white/60 p-4 shadow-lg dark:border-slate-800/60 dark:bg-slate-900/40 text-center flex flex-col items-center justify-between card-hover">
                    {reward.stock <= 0 && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center text-white font-bold text-xl">OUT OF STOCK</div>}
                    <div className="text-5xl">{reward.icon}</div>
                    <p className="font-bold mt-2 text-md flex-grow">{reward.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{reward.description}</p>
                    <div className="w-full">
                        <p className="text-sm font-semibold mt-1 px-3 py-1 bg-amber-500 text-black rounded-full inline-block">{reward.cost} Points</p>
                        <p className="text-xs text-slate-400 mt-2">Stock: {reward.stock}</p>
                        <button onClick={() => setRedeemingReward(reward)} disabled={reward.stock <= 0} className="mt-2 w-full px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-slate-400">Redeem</button>
                        {canManage && <button onClick={() => handleOpenEditModal(reward)} className="mt-1 w-full text-xs text-blue-600 hover:underline">Edit</button>}
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      <AddEditRewardModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={onSaveReward} reward={editingReward || undefined} />
      {redeemingReward && <RedeemRewardModal isOpen={!!redeemingReward} onClose={() => setRedeemingReward(null)} onRedeem={onRedeemReward} reward={redeemingReward} students={students} />}
    </>
  );
};

export default RewardsStoreView;