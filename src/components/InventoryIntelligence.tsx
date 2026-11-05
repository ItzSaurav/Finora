import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  TrendingUp,
  Package,
  Layers,
  CheckCircle,
  Truck,
  X,
  ArrowUpRight,
  LayoutGrid,
  List,
  Eye,
} from 'lucide-react';
import { Product, ProductCategory, StockStatus } from '../types/merchant';
import { sounds } from '../utils/audio';

interface InventoryIntelligenceProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
}

export const InventoryIntelligence: React.FC<InventoryIntelligenceProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [isRestockSuccess, setIsRestockSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // New product form state
  const [newSku, setNewSku] = useState({
    name: '',
    nameHindi: '',
    category: 'Grains & Atta' as ProductCategory,
    packSize: '1 kg Pouch',
    mrp: 100,
    sellingPrice: 95,
    wholesaleCost: 80,
    currentStock: 25,
    safetyStock: 15,
    distributorName: 'Kailash Agro Wholesale',
    barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
  });

  // Working Capital metrics
  const totalStockValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.wholesaleCost * p.currentStock, 0);
  }, [products]);

  const potentialRevenueValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.sellingPrice * p.currentStock, 0);
  }, [products]);

  const lowStockCount = products.filter((p) => p.currentStock <= p.safetyStock).length;
  const expiringCount = products.filter((p) => p.status === 'expiring').length;
  const deadStockCount = products.filter((p) => p.status === 'dead_stock').length;

  const avgGrossMargin = useMemo(() => {
    if (potentialRevenueValue === 0) return 0;
    return (((potentialRevenueValue - totalStockValue) / potentialRevenueValue) * 100).toFixed(1);
  }, [totalStockValue, potentialRevenueValue]);

  // Filtered Inventory
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.nameHindi.includes(q) ||
        p.barcode.includes(q) ||
        p.sku.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === 'reorder') {
        matchesStatus = p.currentStock <= p.safetyStock;
      } else if (statusFilter === 'expiring') {
        matchesStatus = p.status === 'expiring';
      } else if (statusFilter === 'dead_stock') {
        matchesStatus = p.status === 'dead_stock';
      } else if (statusFilter === 'optimal') {
        matchesStatus = p.status === 'optimal';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // Handle restock execution
  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;

    const updated: Product = {
      ...selectedProductForRestock,
      currentStock: selectedProductForRestock.currentStock + restockQty,
      status: 'optimal',
    };

    sounds.playSuccessChime();
    onUpdateProduct(updated);
    setIsRestockSuccess(true);
    setTimeout(() => {
      setIsRestockSuccess(false);
      setSelectedProductForRestock(null);
    }, 1200);
  };

  // Handle Add Product execution
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Product = {
      id: `prod-${Date.now()}`,
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: newSku.barcode,
      name: newSku.name,
      nameHindi: newSku.nameHindi || newSku.name,
      category: newSku.category,
      packSize: newSku.packSize,
      mrp: Number(newSku.mrp),
      sellingPrice: Number(newSku.sellingPrice),
      wholesaleCost: Number(newSku.wholesaleCost),
      currentStock: Number(newSku.currentStock),
      safetyStock: Number(newSku.safetyStock),
      expiryDate: '2027-12-31',
      status: Number(newSku.currentStock) <= Number(newSku.safetyStock) ? 'low_stock' : 'optimal',
      distributorName: newSku.distributorName,
      dailyVelocity: 3.5,
    };

    sounds.playSuccessChime();
    onAddProduct(created);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Working Capital in Stock</span>
            <Layers className="w-4 h-4 text-[#006948]" />
          </div>
          <div className="text-2xl font-bold text-[#131b2e] font-mono-numbers mt-1.5">
            ₹{totalStockValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#006948] font-medium mt-1">
            Retail realizable: ₹{potentialRevenueValue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Average Margin Yield</span>
            <TrendingUp className="w-4 h-4 text-[#006948]" />
          </div>
          <div className="text-2xl font-bold text-[#006948] font-mono-numbers mt-1.5">
            {avgGrossMargin}%
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">
            Standard Kirana benchmark: 14%–18%
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Immediate Reorder Alerts</span>
            <AlertTriangle className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-2xl font-bold text-[#d97706] font-mono-numbers mt-1.5">
            {lowStockCount} <span className="text-xs font-sans font-normal text-[#64748b]">SKUs</span>
          </div>
          <div className="text-[11px] text-[#b45309] font-medium mt-1">
            Units below safety threshold
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#64748b] flex items-center justify-between">
            <span>Shelf Health Risks</span>
            <Clock className="w-4 h-4 text-[#e11d48]" />
          </div>
          <div className="text-2xl font-bold text-[#e11d48] font-mono-numbers mt-1.5">
            {expiringCount + deadStockCount} <span className="text-xs font-sans font-normal text-[#64748b]">items</span>
          </div>
          <div className="text-[11px] text-[#be123c] font-medium mt-1">
            {expiringCount} expiring soon · {deadStockCount} dead capital
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              placeholder="Search by SKU, Hindi transliteration, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#006948] focus:bg-white rounded-lg text-xs text-[#131b2e] outline-none"
            />
          </div>

          {/* Action buttons & View Mode Switcher */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center bg-[#f1f5f9] p-0.5 rounded-lg border border-[#cbd5e1]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#006948] shadow-xs'
                    : 'text-[#64748b] hover:text-[#131b2e]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Shelf (Photos)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#006948] shadow-xs'
                    : 'text-[#64748b] hover:text-[#131b2e]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table List</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#006948] hover:bg-[#005137] text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New SKU</span>
            </button>
          </div>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f1f5f9]">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <span className="text-[#64748b] font-medium text-[11px] mr-1">Status:</span>
            {[
              { id: 'all', label: `All Stock (${products.length})` },
              { id: 'reorder', label: `Reorder Required (${lowStockCount})` },
              { id: 'expiring', label: `Expiring Soon (${expiringCount})` },
              { id: 'dead_stock', label: `Dead Capital (${deadStockCount})` },
              { id: 'optimal', label: 'Optimal Margin' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === btn.id
                    ? 'bg-[#131b2e] text-white shadow-xs'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748b] text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#f8fafc] border border-[#cbd5e1] rounded-md px-2.5 py-1 text-xs text-[#131b2e] outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Grains & Atta">Grains & Atta</option>
              <option value="Edible Oils & Ghee">Edible Oils & Ghee</option>
              <option value="Spices & Masalas">Spices & Masalas</option>
              <option value="Dairy & Staples">Dairy & Staples</option>
              <option value="Packaged Snacks">Packaged Snacks</option>
              <option value="Personal & Home Care">Personal & Home Care</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Content Viewport: Grid vs Table */}
      {viewMode === 'grid' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const marginPct = (((p.sellingPrice - p.wholesaleCost) / p.sellingPrice) * 100).toFixed(1);
              const isLow = p.currentStock <= p.safetyStock;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#e2e8f0] hover:border-[#006948] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Product Packaging Image */}
                  <div className="relative aspect-4/3 w-full bg-[#f8fafc] border-b border-[#f1f5f9] overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94a3b8]">
                        <Package className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}

                    {/* Status Badge overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      {p.status === 'expiring' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a] shadow-xs">
                          Expiring Soon
                        </span>
                      ) : p.status === 'dead_stock' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1f2] text-[#be123c] border border-[#fecdd3] shadow-xs">
                          Dead Capital
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a] shadow-xs">
                          Low Stock ({p.currentStock} left)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] shadow-xs">
                          Optimal Margin
                        </span>
                      )}
                    </div>

                    {/* Quick Lightbox Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewProduct(p)}
                      title="View High-Res Photo"
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 hover:bg-white text-[#131b2e] rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex justify-between items-center text-[10px] font-mono-numbers px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded">
                      <span>{p.sku}</span>
                      <span>{p.packSize}</span>
                    </div>
                  </div>

                  {/* Product Details Body */}
                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-semibold text-[#006948] uppercase tracking-wider">
                        {p.category}
                      </div>
                      <h3 className="font-bold text-xs text-[#131b2e] leading-snug line-clamp-2 mt-0.5">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-[#006948] font-medium mt-0.5">
                        {p.nameHindi}
                      </p>
                    </div>

                    {/* Stock level bar */}
                    <div className="space-y-1 pt-1 border-t border-[#f1f5f9]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#64748b]">Shelf Units:</span>
                        <span className="font-mono-numbers font-bold text-[#131b2e]">
                          {p.currentStock}{' '}
                          <span className="text-[10px] font-normal text-[#94a3b8]">
                            (min {p.safetyStock})
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isLow ? 'bg-amber-500' : 'bg-[#006948]'
                          }`}
                          style={{
                            width: `${Math.min(100, (p.currentStock / (p.safetyStock * 1.5)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Pricing & Margin info */}
                    <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between font-mono-numbers">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-extrabold text-[#006948]">
                            ₹{p.sellingPrice}
                          </span>
                          {p.mrp > p.sellingPrice && (
                            <span className="text-[10px] text-[#94a3b8] line-through">
                              ₹{p.mrp}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748b]">
                          Cost: ₹{p.wholesaleCost}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-[#006948]">
                          {marginPct}%
                        </div>
                        <div className="text-[10px] text-[#059669] font-sans">
                          Gross Margin
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewProduct(p)}
                        className="flex-1 py-1.5 text-xs font-semibold text-[#475569] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Inspect Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductForRestock(p);
                          setRestockQty(p.safetyStock * 2);
                        }}
                        className="flex-1 py-1.5 text-xs font-bold text-white bg-[#006948] hover:bg-[#005137] rounded-lg transition-colors cursor-pointer text-center shadow-xs"
                      >
                        + Restock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* High-Density Inventory Table */
        <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569] font-bold">
                <tr>
                  <th className="py-3 px-4">Item & Product Photo</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Barcode / SKU</th>
                  <th className="py-3 px-3 text-right">Wholesale Cost</th>
                  <th className="py-3 px-3 text-right">Selling (MRP)</th>
                  <th className="py-3 px-3 text-right">Gross Margin</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-sans">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#94a3b8]">
                      No inventory items matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const marginPct = (((p.sellingPrice - p.wholesaleCost) / p.sellingPrice) * 100).toFixed(1);
                    const isLow = p.currentStock <= p.safetyStock;

                    return (
                      <tr key={p.id} className="hover:bg-[#faf8ff] transition-colors">
                        {/* Product Name & Clickable Packshot */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setPreviewProduct(p)}
                              title="Click to view full packaging photo"
                              className="w-12 h-12 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] overflow-hidden shrink-0 flex items-center justify-center relative group cursor-pointer"
                            >
                              {p.image ? (
                                <>
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                </>
                              ) : (
                                <Package className="w-5 h-5 text-[#94a3b8]" />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="font-bold text-[#131b2e] leading-tight">{p.name}</div>
                              <div className="text-[11px] text-[#006948] font-medium">{p.nameHindi}</div>
                              <div className="text-[10px] text-[#64748b]">{p.packSize}</div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-[#475569] whitespace-nowrap">{p.category}</td>

                        {/* Barcode / SKU */}
                        <td className="py-3 px-3 font-mono-numbers text-[#64748b] whitespace-nowrap">
                          <div className="text-[11px] text-[#131b2e] font-semibold">{p.barcode}</div>
                          <div className="text-[10px] text-[#94a3b8]">{p.sku}</div>
                        </td>

                        {/* Wholesale Cost */}
                        <td className="py-3 px-3 text-right font-mono-numbers text-[#475569] whitespace-nowrap">
                          ₹{p.wholesaleCost}
                        </td>

                        {/* Selling / MRP */}
                        <td className="py-3 px-3 text-right font-mono-numbers whitespace-nowrap">
                          <span className="font-bold text-[#131b2e]">₹{p.sellingPrice}</span>
                          {p.mrp > p.sellingPrice && (
                            <span className="ml-1 text-[10px] text-[#94a3b8] line-through">₹{p.mrp}</span>
                          )}
                        </td>

                        {/* Margin % */}
                        <td className="py-3 px-3 text-right font-mono-numbers whitespace-nowrap font-bold">
                          <span
                            className={
                              Number(marginPct) >= 15
                                ? 'text-[#006948]'
                                : Number(marginPct) >= 10
                                ? 'text-[#d97706]'
                                : 'text-[#e11d48]'
                            }
                          >
                            {marginPct}%
                          </span>
                        </td>

                        {/* Stock Level */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono-numbers font-bold text-sm text-[#131b2e]">
                              {p.currentStock}{' '}
                              <span className="text-[10px] font-normal text-[#64748b]">/ {p.safetyStock} min</span>
                            </span>
                            <div className="w-16 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  isLow ? 'bg-amber-500' : 'bg-[#006948]'
                                }`}
                                style={{ width: `${Math.min(100, (p.currentStock / (p.safetyStock * 1.5)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Badges */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {p.status === 'expiring' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                              Expiring Soon
                            </span>
                          ) : p.status === 'dead_stock' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                              Dead Capital
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                              Optimal Margin
                            </span>
                          )}
                        </td>

                        {/* Restock Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedProductForRestock(p);
                              setRestockQty(p.safetyStock * 2);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-[#006948] bg-[#ecfdf5] hover:bg-[#006948] hover:text-white rounded-md transition-colors cursor-pointer"
                          >
                            + Restock PO
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Order Drawer / Modal */}
      {selectedProductForRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#006948]" />
                <h3 className="font-bold text-[#131b2e] text-base">Issue Distributor Purchase Order</h3>
              </div>
              <button
                onClick={() => setSelectedProductForRestock(null)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-5 space-y-4 text-xs">
              <div className="bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0] flex gap-3 items-center">
                {selectedProductForRestock.image && (
                  <div className="w-16 h-16 rounded-lg bg-white border border-[#cbd5e1] overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={selectedProductForRestock.image}
                      alt={selectedProductForRestock.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-[#131b2e] text-sm truncate">{selectedProductForRestock.name}</div>
                  <div className="text-[#006948] font-medium">{selectedProductForRestock.nameHindi}</div>
                  <div className="text-[11px] text-[#64748b]">
                    Distributor: <span className="font-semibold text-[#131b2e]">{selectedProductForRestock.distributorName}</span>
                  </div>
                  <div className="text-[11px] text-[#64748b] font-mono-numbers">
                    Stock: {selectedProductForRestock.currentStock} units · Threshold: {selectedProductForRestock.safetyStock} units
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">
                  Order Quantity (Units):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg font-mono-numbers text-sm text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              <div className="p-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg space-y-1 font-mono-numbers">
                <div className="flex justify-between text-[#047857]">
                  <span>Wholesale Cost per Unit:</span>
                  <span>₹{selectedProductForRestock.wholesaleCost}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#006948] pt-1 border-t border-[#a7f3d0]">
                  <span>Total PO Value:</span>
                  <span>₹{(selectedProductForRestock.wholesaleCost * restockQty).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {isRestockSuccess ? (
                <div className="p-3 bg-[#006948] text-white rounded-lg text-center font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>PO Issued & Stock Updated!</span>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductForRestock(null)}
                    className="px-4 py-2 text-sm text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm PO & Add to Inventory
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add New SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <h3 className="font-bold text-[#131b2e] text-base">Register New SKU in Inventory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#475569] block mb-1">Product Name (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Besan Flour"
                    value={newSku.name}
                    onChange={(e) => setNewSku({ ...newSku, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#475569] block mb-1">Hindi Transliteration (हिंदी)</label>
                  <input
                    type="text"
                    placeholder="e.g. बेसन का आटा"
                    value={newSku.nameHindi}
                    onChange={(e) => setNewSku({ ...newSku, nameHindi: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#475569] block mb-1">Category</label>
                  <select
                    value={newSku.category}
                    onChange={(e) => setNewSku({ ...newSku, category: e.target.value as ProductCategory })}
                    className="w-full px-2 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  >
                    <option value="Grains & Atta">Grains & Atta</option>
                    <option value="Edible Oils & Ghee">Edible Oils & Ghee</option>
                    <option value="Spices & Masalas">Spices & Masalas</option>
                    <option value="Dairy & Staples">Dairy & Staples</option>
                    <option value="Packaged Snacks">Packaged Snacks</option>
                    <option value="Personal & Home Care">Personal & Home Care</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[#475569] block mb-1">Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 g Pouch"
                    value={newSku.packSize}
                    onChange={(e) => setNewSku({ ...newSku, packSize: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono-numbers">
                <div>
                  <label className="font-bold text-[#475569] block mb-1 font-sans">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={newSku.wholesaleCost}
                    onChange={(e) => setNewSku({ ...newSku, wholesaleCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#475569] block mb-1 font-sans">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newSku.sellingPrice}
                    onChange={(e) => setNewSku({ ...newSku, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#475569] block mb-1 font-sans">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={newSku.mrp}
                    onChange={(e) => setNewSku({ ...newSku, mrp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono-numbers">
                <div>
                  <label className="font-bold text-[#475569] block mb-1 font-sans">Initial Stock Units</label>
                  <input
                    type="number"
                    value={newSku.currentStock}
                    onChange={(e) => setNewSku({ ...newSku, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#475569] block mb-1 font-sans">Safety Threshold Units</label>
                  <input
                    type="number"
                    value={newSku.safetyStock}
                    onChange={(e) => setNewSku({ ...newSku, safetyStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#475569] block mb-1">Assigned Distributor</label>
                <input
                  type="text"
                  value={newSku.distributorName}
                  onChange={(e) => setNewSku({ ...newSku, distributorName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-[#131b2e] outline-none focus:border-[#006948]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Item to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Image Lightbox Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#cbd5e1] overflow-hidden flex flex-col">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006948]" />
                <h3 className="font-bold text-[#131b2e] text-sm">Product Packaging Spec & Photo</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* High-Res Image Display */}
              <div className="aspect-4/3 w-full rounded-xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden shadow-inner flex items-center justify-center">
                {previewProduct.image ? (
                  <img
                    src={previewProduct.image}
                    alt={previewProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-[#94a3b8]" />
                )}
              </div>

              {/* Product Info Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold text-[#131b2e] leading-snug">
                      {previewProduct.name}
                    </h2>
                    <p className="text-xs font-semibold text-[#006948] mt-0.5">
                      {previewProduct.nameHindi}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {previewProduct.packSize} · Category: {previewProduct.category}
                    </p>
                  </div>
                  <span className="font-mono-numbers px-2.5 py-1 bg-[#f1f5f9] rounded text-xs font-bold text-[#131b2e] border border-[#e2e8f0]">
                    {previewProduct.barcode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#f1f5f9] font-mono-numbers text-xs">
                  <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#64748b] font-sans">Wholesale Cost</div>
                    <div className="font-bold text-sm text-[#131b2e]">₹{previewProduct.wholesaleCost}</div>
                  </div>
                  <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0]">
                    <div className="text-[10px] text-[#64748b] font-sans">Retail MRP</div>
                    <div className="font-bold text-sm text-[#006948]">₹{previewProduct.sellingPrice}</div>
                  </div>
                  <div className="bg-[#ecfdf5] p-2.5 rounded-lg border border-[#a7f3d0]">
                    <div className="text-[10px] text-[#047857] font-sans">Gross Margin</div>
                    <div className="font-bold text-sm text-[#006948]">
                      {(((previewProduct.sellingPrice - previewProduct.wholesaleCost) / previewProduct.sellingPrice) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] p-2.5 rounded-lg border border-[#e2e8f0] flex justify-between items-center text-xs">
                  <span className="text-[#64748b]">Distributor Agency:</span>
                  <span className="font-semibold text-[#131b2e]">{previewProduct.distributorName}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setPreviewProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prod = previewProduct;
                    setPreviewProduct(null);
                    setSelectedProductForRestock(prod);
                    setRestockQty(prod.safetyStock * 2);
                  }}
                  className="px-4 py-2 bg-[#006948] hover:bg-[#005137] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Create Restock PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
