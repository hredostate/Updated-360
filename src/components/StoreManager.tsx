
import React, { useState, useMemo, useEffect } from 'react';
import type { InventoryItem, Order, UserProfile, OrderStatus, OrderNote } from '../types';
import { ShoppingCartIcon, PlusCircleIcon, EditIcon, TrashIcon, ChartBarIcon, PackageIcon, EyeIcon, SearchIcon, TagIcon, ChevronDownIcon, DownloadIcon } from './common/icons';
import Spinner from './common/Spinner';
import Pagination from './common/Pagination';
import { exportToCsv } from '../utils/export';

interface StoreManagerProps {
    inventory: InventoryItem[];
    orders: Order[];
    onSaveItem: (item: Partial<InventoryItem>) => Promise<boolean>;
    onDeleteItem: (id: number) => Promise<boolean>;
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onUpdateOrderStatus?: (orderId: number, status: OrderStatus) => Promise<void>;
    onAddOrderNote?: (orderId: number, note: string) => Promise<void>;
    onDeleteOrderNote?: (noteId: number) => Promise<void>;
}

type ManagerTab = 'dashboard' | 'products' | 'orders' | 'categories' | 'analytics';

const statusColors: Record<OrderStatus, string> = {
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'Returned': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'Cancelled': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

const StoreManager: React.FC<StoreManagerProps> = ({ inventory, orders, onSaveItem, onDeleteItem, addToast, onUpdateOrderStatus, onAddOrderNote, onDeleteOrderNote }) => {
    const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Order management state
    const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>('All');
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
    const [newOrderNote, setNewOrderNote] = useState('');
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [orderPage, setOrderPage] = useState(1);
    const ORDERS_PER_PAGE = 10;

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        sku: '',
        image_url: '',
        is_published: true,
        is_featured: false,
        discount_percent: '0'
    });

    // Analytics calculations - with null safety
    const stats = useMemo(() => {
        const safeInventory = inventory || [];
        const safeOrders = orders || [];
        
        const totalProducts = safeInventory.length;
        const publishedProducts = safeInventory.filter(i => i.is_published).length;
        const lowStockProducts = safeInventory.filter(i => (i.stock || 0) < 10).length;
        const outOfStock = safeInventory.filter(i => (i.stock || 0) === 0).length;
        const totalValue = safeInventory.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
        const categories = [...new Set(safeInventory.map(i => i.category).filter(Boolean))];
        
        // Order stats
        const totalOrders = safeOrders.length;
        const pendingOrders = safeOrders.filter(o => o.status === 'Pending').length;
        const completedOrders = safeOrders.filter(o => o.status === 'Delivered').length;
        const totalRevenue = safeOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.total_amount || 0), 0);
        
        return { totalProducts, publishedProducts, lowStockProducts, outOfStock, totalValue, categories, totalOrders, pendingOrders, completedOrders, totalRevenue };
    }, [inventory, orders]);

    const filteredProducts = useMemo(() => {
        const safeInventory = inventory || [];
        return safeInventory.filter(item => {
            const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [inventory, searchQuery, selectedCategory]);

    // Order filtering
    const filteredOrders = useMemo(() => {
        const safeOrders = orders || [];
        return safeOrders.filter(order => {
            const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
            const matchesSearch = 
                order.user?.name?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                String(order.id).includes(orderSearchQuery) ||
                order.payment_reference?.toLowerCase().includes(orderSearchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [orders, orderStatusFilter, orderSearchQuery]);

    const orderTotalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const start = (orderPage - 1) * ORDERS_PER_PAGE;
        return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
    }, [filteredOrders, orderPage]);

    useEffect(() => {
        setOrderPage(1);
    }, [orderStatusFilter, orderSearchQuery]);

    const handleOrderStatusChange = async (orderId: number, newStatus: OrderStatus) => {
        if (!onUpdateOrderStatus) return;
        setIsUpdatingOrder(true);
        await onUpdateOrderStatus(orderId, newStatus);
        setIsUpdatingOrder(false);
        addToast('Order status updated', 'success');
    };

    const handleAddNoteSubmit = async (orderId: number) => {
        if (!onAddOrderNote || !newOrderNote.trim()) return;
        setIsAddingNote(true);
        await onAddOrderNote(orderId, newOrderNote);
        setIsAddingNote(false);
        setNewOrderNote('');
        addToast('Note added', 'success');
    };

    const handleExportOrders = () => {
        const dataToExport = filteredOrders.map(o => ({
            'Order ID': o.id,
            'Customer': o.user?.name || 'Unknown',
            'Amount': o.total_amount,
            'Status': o.status,
            'Payment Ref': o.payment_reference || '',
            'Date': new Date(o.created_at).toLocaleDateString()
        }));
        exportToCsv(dataToExport, `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleOpenForm = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                category: item.category || '',
                price: item.price.toString(),
                stock: item.stock.toString(),
                sku: item.sku || '',
                image_url: item.image_url || '',
                is_published: item.is_published,
                is_featured: item.is_featured || false,
                discount_percent: (item.discount_percent || 0).toString()
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                category: '',
                price: '',
                stock: '',
                sku: '',
                image_url: '',
                is_published: true,
                is_featured: false,
                discount_percent: '0'
            });
        }
        setIsFormOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            addToast('Name and price are required', 'error');
            return;
        }
        
        setIsSaving(true);
        const itemData: Partial<InventoryItem> = {
            ...(editingItem ? { id: editingItem.id } : {}),
            name: formData.name,
            description: formData.description,
            category: formData.category,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock) || 0,
            sku: formData.sku,
            image_url: formData.image_url,
            is_published: formData.is_published,
            is_featured: formData.is_featured,
            discount_percent: parseFloat(formData.discount_percent) || 0
        };
        
        const success = await onSaveItem(itemData);
        setIsSaving(false);
        
        if (success) {
            addToast(editingItem ? 'Product updated!' : 'Product created!', 'success');
            setIsFormOpen(false);
        } else {
            addToast('Failed to save product', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        const success = await onDeleteItem(id);
        if (success) {
            addToast('Product deleted', 'success');
        } else {
            addToast('Failed to delete product', 'error');
        }
    };

    const handleTogglePublish = async (item: InventoryItem) => {
        const success = await onSaveItem({ id: item.id, is_published: !item.is_published });
        if (success) {
            addToast(item.is_published ? 'Product unpublished' : 'Product published', 'success');
        }
    };

    const handleToggleFeatured = async (item: InventoryItem) => {
        const success = await onSaveItem({ id: item.id, is_featured: !item.is_featured });
        if (success) {
            addToast(item.is_featured ? 'Removed from featured' : 'Added to featured', 'success');
        }
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm">Total Products</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
                            <p className="text-xs text-blue-200 mt-1">{stats.publishedProducts} published</p>
                        </div>
                        <PackageIcon className="w-8 h-8 text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 text-sm">Total Revenue</p>
                            <p className="text-3xl font-bold mt-1">₦{(stats.totalRevenue || 0).toLocaleString()}</p>
                            <p className="text-xs text-green-200 mt-1">{stats.completedOrders} orders completed</p>
                        </div>
                        <ChartBarIcon className="w-8 h-8 text-green-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-amber-100 text-sm">Low Stock Alert</p>
                            <p className="text-3xl font-bold mt-1">{stats.lowStockProducts}</p>
                            <p className="text-xs text-amber-200 mt-1">{stats.outOfStock} out of stock</p>
                        </div>
                        <ShoppingCartIcon className="w-8 h-8 text-amber-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-purple-100 text-sm">Inventory Value</p>
                            <p className="text-3xl font-bold mt-1">₦{(stats.totalValue || 0).toLocaleString()}</p>
                            <p className="text-xs text-purple-200 mt-1">{stats.categories.length} categories</p>
                        </div>
                        <TagIcon className="w-8 h-8 text-purple-200" />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Items */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Low Stock Items
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(inventory || []).filter(i => (i.stock || 0) < 10 && (i.stock || 0) > 0).slice(0, 5).map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-3">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">📦</div>
                                    )}
                                    <div>
                                        <p className="font-medium text-sm">{item.name}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Only {item.stock} left</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleOpenForm(item)}
                                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                                >
                                    Restock
                                </button>
                            </div>
                        ))}
                        {(inventory || []).filter(i => (i.stock || 0) < 10 && (i.stock || 0) > 0).length === 0 && (
                            <p className="text-slate-500 text-center py-4">All items well stocked! 🎉</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(orders || []).slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">Order #{order.id}</p>
                                    <p className="text-xs text-slate-500">₦{(order.total_amount || 0).toLocaleString()}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status}
                                </span>
                            </div>
                        ))}
                        {(orders || []).length === 0 && (
                            <p className="text-slate-500 text-center py-4">No orders yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold mb-4">Category Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {stats.categories.map(cat => {
                        const catItems = (inventory || []).filter(i => i.category === cat);
                        const catValue = catItems.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
                        return (
                            <div key={cat} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <p className="font-bold text-2xl text-slate-800 dark:text-white">{catItems.length}</p>
                                <p className="text-xs text-slate-500 truncate">{cat}</p>
                                <p className="text-xs text-green-600 font-medium mt-1">₦{catValue.toLocaleString()}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderProducts = () => (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        />
                    </div>
                    <select 
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                        <option value="All">All Categories</option>
                        {stats.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(item => (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-xl border ${item.is_published ? 'border-slate-200 dark:border-slate-700' : 'border-red-200 dark:border-red-800'} overflow-hidden hover:shadow-lg transition-shadow`}>
                        <div className="relative h-40 bg-slate-100 dark:bg-slate-900">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                            )}
                            <div className="absolute top-2 left-2 flex gap-1">
                                {!item.is_published && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">Draft</span>
                                )}
                                {item.is_featured && (
                                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded">Featured</span>
                                )}
                            </div>
                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {item.stock} in stock
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                                    <p className="text-xs text-slate-500">{item.category}</p>
                                </div>
                                <span className="font-bold text-green-600">₦{(item.price || 0).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                            
                            <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                                <button 
                                    onClick={() => handleOpenForm(item)}
                                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 bg-slate-100 dark:bg-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                                >
                                    <EditIcon className="w-3 h-3" /> Edit
                                </button>
                                <button 
                                    onClick={() => handleTogglePublish(item)}
                                    className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded ${
                                        item.is_published 
                                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                >
                                    <EyeIcon className="w-3 h-3" /> {item.is_published ? 'Hide' : 'Publish'}
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="flex items-center justify-center gap-1 text-xs py-2 px-3 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    <TrashIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredProducts.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-500">
                        No products found matching your search.
                    </div>
                )}
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="space-y-4">
            {/* Order Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search order ID, customer name..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select 
                    value={orderStatusFilter} 
                    onChange={(e) => setOrderStatusFilter(e.target.value as OrderStatus | 'All')}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Returned">Returned</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <button onClick={handleExportOrders} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <DownloadIcon className="w-4 h-4" /> Export
                </button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {paginatedOrders.map(order => (
                    <div key={order.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div 
                            className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        >
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg font-bold text-blue-700 dark:text-blue-300">
                                    #{order.id}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{order.user?.name || 'Unknown User'}</p>
                                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                <span className="font-bold text-lg text-slate-900 dark:text-white">₦{Number(order.total_amount || 0).toLocaleString()}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusColors[order.status] || 'bg-gray-100'}`}>
                                    {order.status}
                                </span>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        
                        {expandedOrderId === order.id && (
                            <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Order Details */}
                                    <div className="lg:col-span-2 space-y-4">
                                        <h3 className="font-bold text-sm uppercase text-slate-500">Items</h3>
                                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-100 dark:bg-slate-700 text-left">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Item</th>
                                                        <th className="p-3 font-semibold text-center">Qty</th>
                                                        <th className="p-3 font-semibold text-right">Price</th>
                                                        <th className="p-3 font-semibold text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items?.map(item => (
                                                        <tr key={item.id} className="border-t border-slate-200 dark:border-slate-700">
                                                            <td className="p-3 flex items-center gap-3">
                                                                {item.inventory_item?.image_url && <img src={item.inventory_item.image_url} className="w-8 h-8 rounded object-cover" />}
                                                                {item.inventory_item?.name || 'Unknown Item'}
                                                            </td>
                                                            <td className="p-3 text-center">{item.quantity}</td>
                                                            <td className="p-3 text-right">₦{Number(item.unit_price || 0).toLocaleString()}</td>
                                                            <td className="p-3 text-right font-medium">₦{(item.quantity * Number(item.unit_price || 0)).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="flex justify-between items-center pt-4">
                                            <div>
                                                <p className="text-sm text-slate-500">Payment Ref: <span className="font-mono text-slate-700 dark:text-slate-300">{order.payment_reference || 'N/A'}</span></p>
                                            </div>
                                            {onUpdateOrderStatus && (
                                                <div className="flex items-center gap-3">
                                                    <label className="text-sm font-medium">Change Status:</label>
                                                    <select 
                                                        value={order.status} 
                                                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                                                        disabled={isUpdatingOrder}
                                                        className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Paid">Paid</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Returned">Returned</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes Section */}
                                    <div className="space-y-4 border-l border-slate-200 dark:border-slate-700 pl-0 lg:pl-8">
                                        <h3 className="font-bold text-sm uppercase text-slate-500">Admin Notes</h3>
                                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                            {(!order.notes || order.notes.length === 0) && <p className="text-sm text-slate-500 italic">No notes yet.</p>}
                                            {order.notes?.map(note => (
                                                <div key={note.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 relative group">
                                                    <p className="text-sm text-slate-800 dark:text-slate-200">{note.note}</p>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                                        <span>{note.author?.name} • {new Date(note.created_at).toLocaleDateString()}</span>
                                                        {onDeleteOrderNote && (
                                                            <button onClick={() => onDeleteOrderNote(note.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <TrashIcon className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {onAddOrderNote && (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={newOrderNote}
                                                    onChange={e => setNewOrderNote(e.target.value)}
                                                    placeholder="Add internal note..."
                                                    className="flex-grow p-2 text-sm border rounded-md bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                                                />
                                                <button 
                                                    onClick={() => handleAddNoteSubmit(order.id)} 
                                                    disabled={isAddingNote || !newOrderNote.trim()}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-400"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {filteredOrders.length === 0 && (
                    <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        No orders found matching your filters.
                    </div>
                )}
            </div>
            
            <Pagination 
                currentPage={orderPage} 
                totalPages={orderTotalPages} 
                onPageChange={setOrderPage} 
                itemsPerPage={ORDERS_PER_PAGE}
                totalItems={filteredOrders.length}
            />
        </div>
    );

    const tabs: { id: ManagerTab; label: string; icon: typeof ChartBarIcon }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
        { id: 'products', label: 'Products', icon: PackageIcon },
        { id: 'orders', label: 'Orders', icon: ShoppingCartIcon },
        { id: 'categories', label: 'Categories', icon: TagIcon },
        { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <ShoppingCartIcon className="w-8 h-8 text-indigo-600" />
                        Store Manager
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Manage products, inventory, and optimize your store.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'products' && renderProducts()}
                {activeTab === 'orders' && renderOrders()}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Product Categories</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.categories.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-500">
                                    <TagIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                    <p className="text-lg font-medium">No Categories Yet</p>
                                    <p className="text-sm">Categories are created automatically when you add products with a category.</p>
                                </div>
                            ) : stats.categories.map((category, idx) => {
                                const categoryProducts = (inventory || []).filter(i => i.category === category);
                                const categoryValue = categoryProducts.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
                                const lowStock = categoryProducts.filter(i => (i.stock || 0) < 10).length;
                                return (
                                    <div key={idx} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <TagIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">{category}</h4>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Products</span>
                                                <span className="font-medium">{categoryProducts.length}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Total Stock</span>
                                                <span className="font-medium">{categoryProducts.reduce((sum, i) => sum + (i.stock || 0), 0)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Value</span>
                                                <span className="font-medium text-green-600">₦{categoryValue.toLocaleString()}</span>
                                            </div>
                                            {lowStock > 0 && (
                                                <div className="flex justify-between text-amber-600">
                                                    <span>Low Stock</span>
                                                    <span className="font-medium">{lowStock}</span>
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedCategory(category); setActiveTab('products'); }}
                                            className="mt-3 w-full py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                        >
                                            View Products
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold">Sales & Inventory Analytics</h3>
                        
                        {/* Revenue Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                                <p className="text-sm opacity-90">Total Revenue</p>
                                <p className="text-2xl font-bold">₦{(stats.totalRevenue || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                                <p className="text-sm opacity-90">Total Orders</p>
                                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                                <p className="text-sm opacity-90">Inventory Value</p>
                                <p className="text-2xl font-bold">₦{(stats.totalValue || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white">
                                <p className="text-sm opacity-90">Avg Order Value</p>
                                <p className="text-2xl font-bold">₦{stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() : 0}</p>
                            </div>
                        </div>

                        {/* Category Performance */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h4 className="font-semibold mb-4">Category Performance</h4>
                            <div className="space-y-3">
                                {stats.categories.length === 0 ? (
                                    <p className="text-slate-500 text-center py-4">No categories to display</p>
                                ) : stats.categories.map((category, idx) => {
                                    const categoryProducts = (inventory || []).filter(i => i.category === category);
                                    const categoryValue = categoryProducts.reduce((sum, i) => sum + ((i.price || 0) * (i.stock || 0)), 0);
                                    const percentage = stats.totalValue > 0 ? (categoryValue / stats.totalValue * 100) : 0;
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{category}</span>
                                                <span className="font-medium">₦{categoryValue.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-purple-500 rounded-full transition-all"
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h4 className="font-semibold mb-4">Top Products by Value</h4>
                            <div className="space-y-3">
                                {(inventory || [])
                                    .map(p => ({ ...p, value: (p.price || 0) * (p.stock || 0) }))
                                    .sort((a, b) => b.value - a.value)
                                    .slice(0, 5)
                                    .map((product, idx) => (
                                        <div key={product.id} className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-medium">{idx + 1}</span>
                                            <div className="flex-1">
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-slate-500">{product.category} • Stock: {product.stock}</p>
                                            </div>
                                            <span className="font-semibold text-green-600">₦{product.value.toLocaleString()}</span>
                                        </div>
                                    ))
                                }
                                {(inventory || []).length === 0 && (
                                    <p className="text-slate-500 text-center py-4">No products to display</p>
                                )}
                            </div>
                        </div>

                        {/* Order Status Distribution */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h4 className="font-semibold mb-4">Order Status Distribution</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {(['Pending', 'Paid', 'Delivered', 'Returned', 'Cancelled'] as OrderStatus[]).map(status => {
                                    const count = (orders || []).filter(o => o.status === status).length;
                                    const percentage = stats.totalOrders > 0 ? (count / stats.totalOrders * 100) : 0;
                                    return (
                                        <div key={status} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${statusColors[status]}`}>{status}</span>
                                            <p className="text-2xl font-bold">{count}</p>
                                            <p className="text-xs text-slate-500">{percentage.toFixed(1)}%</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingItem ? 'Edit Product' : 'Add New Product'}
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Product Name *</label>
                                    <input 
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="Enter product name"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 h-24"
                                        placeholder="Product description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <input 
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="e.g., Uniforms, Books"
                                        list="categories"
                                    />
                                    <datalist id="categories">
                                        {stats.categories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SKU</label>
                                    <input 
                                        type="text"
                                        value={formData.sku}
                                        onChange={e => setFormData(f => ({ ...f, sku: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="Product SKU"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price (₦) *</label>
                                    <input 
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                                    <input 
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData(f => ({ ...f, stock: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Discount %</label>
                                    <input 
                                        type="number"
                                        value={formData.discount_percent}
                                        onChange={e => setFormData(f => ({ ...f, discount_percent: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Image URL</label>
                                    <input 
                                        type="url"
                                        value={formData.image_url}
                                        onChange={e => setFormData(f => ({ ...f, image_url: e.target.value }))}
                                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={e => setFormData(f => ({ ...f, is_published: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-300"
                                        />
                                        <span className="text-sm">Published</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={e => setFormData(f => ({ ...f, is_featured: e.target.checked }))}
                                            className="w-4 h-4 rounded border-slate-300"
                                        />
                                        <span className="text-sm">Featured</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
                            <button 
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
                            >
                                {isSaving ? <Spinner size="sm" /> : (editingItem ? 'Update Product' : 'Create Product')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreManager;
