'use client';

import React, { useState } from 'react';
import { X, Search, Check, Type, Sparkles } from 'lucide-react';
import { CREATOR_FONTS } from '@/app/editor/page';

interface FontSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFont: string;
  onSelectFont: (fontFamily: string) => void;
}

export function FontSelectionModal({
  isOpen,
  onClose,
  selectedFont,
  onSelectFont,
}: FontSelectionModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Viral', 'Modern', 'Editorial', 'Retro', 'Handwritten', 'Devanagari'];

  const filteredFonts = CREATOR_FONTS.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(search.toLowerCase());
    const fontCat = (font as any).category || 'Modern';
    const matchesCategory = activeCategory === 'All' || fontCat.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Type size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Select Creator Font</h3>
              <p className="text-xs text-slate-400">
                Choose typography tuned for high retention vertical captions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
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
              placeholder="Search fonts (e.g. Anton, Montserrat, Kalam)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950/80 border border-white/5 text-slate-400 hover:text-white'
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
            <div className="text-center py-12 text-slate-500 text-xs">
              No fonts match your search query
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isSelected = selectedFont === font.name;

              return (
                <div
                  key={font.name}
                  onClick={() => {
                    onSelectFont(font.name);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{font.name}</span>
                      {(font as any).category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                          {(font as any).category}
                        </span>
                      )}
                    </div>
                    {/* Live Font Sample Preview */}
                    <div
                      style={{ fontFamily: (font as any).family || font.name }}
                      className="text-lg font-black tracking-wide text-amber-400 pt-0.5"
                    >
                      VIRAL CAPTIONS 2026
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
