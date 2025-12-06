
import React, { useState, useMemo } from 'react';
import type { InventoryItem, UserProfile, OrderItem } from '../types';
import { BanknotesIcon, ShoppingCartIcon, PlusCircleIcon, CloseIcon } from './common/icons';
import Spinner from './common/Spinner';

interface StorefrontViewProps {
    inventory: InventoryItem[];
    onCreateOrder: (items: { inventory_item_id: number; quantity: number; unit_price: number }[]) => Promise<boolean>;
    userProfile: UserProfile;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface CartItem extends InventoryItem {
    cartQuantity: number;
}

const StorefrontView: React.FC<StorefrontViewProps> = ({ inventory, onCreateOrder, userProfile, addToast }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    const publishedItems = useMemo(() => {
        return inventory.filter(item => item.is_published && item.stock > 0);
    }, [inventory]);

    const filteredItems = useMemo(() => {
        return publishedItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [publishedItems, searchQuery, categoryFilter]);

    const categories = ['All', ...Array.from(new Set(publishedItems.map(i => i.category)))];

    const addToCart = (item: InventoryItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                if (existing.cartQuantity >= item.stock) {
                    addToast(`Only ${item.stock} items available.`, 'error');
                    return prev;
                }
                return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
            }
            return [...prev, { ...item, cartQuantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === itemId) {
                    const newQty = item.cartQuantity + delta;
                    if (newQty <= 0) return item; // Don't remove, explicitly remove with button
                    const originalItem = inventory.find(i => i.id === itemId);
                    if (originalItem && newQty > originalItem.stock) {
                         addToast(`Max stock reached.`, 'info');
                         return item;
                    }
                    return { ...item, cartQuantity: newQty };
                }
                return item;
            });
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        // Construct order payload
        const orderItems = cart.map(item => ({
            inventory_item_id: item.id,
            quantity: item.cartQuantity,
            unit_price: item.price
        }));

        const success = await onCreateOrder(orderItems);
        setIsCheckingOut(false);
        if (success) {
            setCart([]);
            setIsCartOpen(false);
            addToast('Order placed successfully!', 'success');
        } else {
            addToast('Failed to place order.', 'error');
        }
    };

    return (
        <div className="relative h-full flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BanknotesIcon className="w-8 h-8 text-indigo-600" />
                        School Store
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Purchase uniforms, books, and supplies.</p>
                </div>
                <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="relative p-3 bg-white dark:bg-slate-800 rounded-full shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <ShoppingCartIcon className="w-6 h-6 text-slate-700 dark:text-white" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="Search items..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="flex-grow p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
                />
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                        <div className="h-48 bg-slate-100 dark:bg-slate-900 relative">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {item.stock} in stock
                            </div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{item.name}</h3>
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">{item.category}</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-grow">{item.description}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="font-bold text-xl text-green-600 dark:text-green-400">₦{item.price.toLocaleString()}</span>
                                <button 
                                    onClick={() => addToCart(item)}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-transform"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-500">
                        No items found matching your search.
                    </div>
                )}
            </div>

            {/* Cart Slide-over */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShoppingCartIcon className="w-6 h-6" /> Your Cart
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center py-20 text-slate-500">
                                    <p className="text-4xl mb-2">🛒</p>
                                    <p>Your cart is empty.</p>
                                    <button onClick={() => setIsCartOpen(false)} className="mt-4 text-indigo-600 font-semibold hover:underline">Start Shopping</button>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <div className="w-16 h-16 bg-white rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                                            {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</h4>
                                            <p className="text-xs text-slate-500">₦{item.price.toLocaleString()}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-sm font-bold hover:bg-slate-300">-</button>
                                                <span className="text-sm font-semibold">{item.cartQuantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-sm font-bold hover:bg-slate-300">+</button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="font-bold text-slate-900 dark:text-white">₦{(item.price * item.cartQuantity).toLocaleString()}</span>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                                <CloseIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">Total</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">₦{cartTotal.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={handleCheckout} 
                                disabled={cart.length === 0 || isCheckingOut}
                                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-green-500/20"
                            >
                                {isCheckingOut ? <Spinner size="sm"/> : 'Proceed to Checkout'}
                            </button>
                             <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                Secured by Paystack
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorefrontView;
