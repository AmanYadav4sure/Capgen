'use client';

import { useState, useMemo } from 'react';
import { X, Search, Check, Type } from 'lucide-react';
import { CREATOR_FONTS } from '@/lib/creator-fonts';
import Modal from '@/components/Modal';

interface FontSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFont: string;
  onSelectFont: (fontFamily: string) => void;
}

const CATEGORIES = ['All', 'Viral', 'Modern', 'Editorial', 'Retro', 'Handwritten', 'Devanagari'];

export function FontSelectionModal({
  isOpen,
  onClose,
  selectedFont,
  onSelectFont,
}: FontSelectionModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredFonts = useMemo(() => {
    return CREATOR_FONTS.filter((font) => {
      const matchesSearch = font.name.toLowerCase().includes(search.toLowerCase());
      const fontCat = font.category || 'Modern';
      const matchesCategory =
        activeCategory === 'All' || fontCat.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Choose a caption font"
      className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl flex flex-col max-h-[85vh] text-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/25 text-blue-600 flex items-center justify-center">
            <Type size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Select Creator Font</h3>
            <p className="text-xs text-slate-500">Choose a font for your caption text</p>
          </div>
        </div>
        <button
          aria-label="Close font selection"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            aria-label="Search caption fonts"
            placeholder="Search fonts (e.g. Anton, Montserrat, Kalam)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Font Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {filteredFonts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No fonts match your search query
          </div>
        ) : (
          filteredFonts.map((font) => {
            const isSelected = selectedFont === font.value;

            return (
              <button
                type="button"
                aria-pressed={isSelected}
                key={font.name}
                onClick={() => {
                  onSelectFont(font.value);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-slate-900 shadow-lg ring-1 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{font.name}</span>
                    {font.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {font.category}
                      </span>
                    )}
                  </div>
                  {/* Live Font Sample Preview */}
                  <div
                    style={{ fontFamily: font.family }}
                    className="text-lg font-black tracking-wide text-slate-900 pt-0.5"
                  >
                    {font.category === 'Devanagari'
                      ? 'हरेक शब्द स्पष्ट'
                      : "Here's how I made this."}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
