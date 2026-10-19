'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Search, Plus, Check, Clock, Flame, Sparkles, X, Info } from 'lucide-react';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

interface MenuSectionProps {
  initialItems: MenuItem[];
}

export function MenuSection({ initialItems }: MenuSectionProps) {
  const { addItem } = useCart();
  const [items] = useState<MenuItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItemModal, setActiveItemModal] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalInstructions, setModalInstructions] = useState('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filter items based on category and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item, 1);
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1200);
  };

  const handleOpenModal = (item: MenuItem) => {
    setActiveItemModal(item);
    setModalQuantity(1);
    setModalInstructions('');
  };

  const handleModalAdd = () => {
    if (!activeItemModal) return;
    addItem(activeItemModal, modalQuantity, modalInstructions);
    setActiveItemModal(null);
  };

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  return (
    <section id="menu" className="py-20 bg-zinc-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Handcrafted Kitchen Menu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Explore Our Nigerian Delicacies
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Prepared to order using heritage recipes, hardwood smoke, and the freshest local ingredients.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-6 mb-12">
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, suya, jollof, soups, ingredients..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-sm shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-zinc-100 text-zinc-950 shadow-lg shadow-black/40 scale-105'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-850 border border-zinc-800/80'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl p-8 max-w-lg mx-auto">
            <Info className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-200">No dishes found</h3>
            <p className="text-zinc-500 text-sm mt-1">Try clearing your search query or picking another category.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isJustAdded = justAddedId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenModal(item)}
                  className="group relative rounded-2xl bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/90 transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-black/70 cursor-pointer"
                >
                  {/* Food Image */}
                  <div className="relative h-56 w-full overflow-hidden bg-zinc-950">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                    {/* Featured / Best Seller Badge */}
                    {item.isFeatured && (
                      <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Chef Pick</span>
                      </div>
                    )}

                    {/* Spice Level Indicator */}
                    {item.spicyLevel > 0 && (
                      <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-2 py-1 rounded-lg text-[10px] font-bold text-orange-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>
                          {item.spicyLevel === 1 ? 'Mild' : item.spicyLevel === 2 ? 'Spicy' : 'Hot'}
                        </span>
                      </div>
                    )}

                    {/* Preparation Time */}
                    <div className="absolute bottom-3 left-3 text-xs text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{item.preparationTimeMinutes}m</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-white group-hover:text-zinc-200 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 border border-zinc-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-lg font-black text-white">{formatNaira(item.price)}</span>

                      <button
                        onClick={(e) => handleQuickAdd(item, e)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                          isJustAdded
                            ? 'bg-zinc-200 text-zinc-950'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-black" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-zinc-300" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail & Customization Modal */}
      {activeItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Image */}
            <div className="relative h-64 w-full">
              <Image
                src={activeItemModal.image}
                alt={activeItemModal.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              <button
                onClick={() => setActiveItemModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-zinc-400 hover:text-white border border-zinc-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-white">{activeItemModal.name}</h3>
                  <span className="text-xl font-black text-white">
                    {formatNaira(activeItemModal.price * modalQuantity)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {activeItemModal.description}
                </p>
              </div>

              {/* Special Instructions Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Kitchen Notes or Preferences (Optional)
                </label>
                <input
                  type="text"
                  value={modalInstructions}
                  onChange={(e) => setModalInstructions(e.target.value)}
                  placeholder="e.g. Extra pepper on the side, no onions on suya, mild spice"
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Quantity Controls & Add to Cart */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-1.5">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="text-zinc-400 hover:text-white px-2 text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-bold text-white">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity(Math.min(20, modalQuantity + 1))}
                    className="text-zinc-400 hover:text-white px-2 text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleModalAdd}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 text-zinc-950 font-bold text-sm hover:from-white hover:to-zinc-200 transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Bag • {formatNaira(activeItemModal.price * modalQuantity)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
