'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getOrCreateUserProfile } from '@/lib/firebase/db';
import { UserProfile } from '@/lib/firebase/types';
import { startPaddleCheckout } from '@/lib/paddle';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      getOrCreateUserProfile({ uid: user.uid, email: user.email, displayName: user.displayName }).then(setCurrentUser);
    } else {
      setCurrentUser(null);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleCheckout = async (priceId: string) => {
    if (!currentUser) {
      alert('Please sign in first to purchase a subscription plan.');
      return;
    }

    try {
      await startPaddleCheckout({
        priceId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
      });
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const proPriceId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || 'pri_pro_default';
  const teamPriceId = process.env.NEXT_PUBLIC_PADDLE_TEAM_PRICE_ID || 'pri_team_default';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 200,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '24px sm:36px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          position: 'relative',
          color: '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'grid',
            placeItems: 'center',
            color: '#64748b',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 24px', padding: '0 10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--blue)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: '#edf5ff',
              padding: '4px 12px',
              borderRadius: '9999px',
            }}
          >
            UPGRADE YOUR CREATOR STUDIO
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '12px 0 6px', letterSpacing: '-0.03em' }}>
            Choose the Plan That Fits Your Growth
          </h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            Unlock 4K watermark-free exports, 1,500 monthly credits, and exclusive motion presets.
          </p>
        </div>

        {/* 3 Pricing Cards Grid - Responsive Auto-fit */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Card 1: Free Tier */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                STARTER
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>Free Tier</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 16px' }}>
                $0 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ forever</span>
              </div>

              <ul style={{ padding: 0, margin: '0 0 20px', listStyle: 'none', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> 2 free video exports
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> 100 MB max video upload
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> Basic presets
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> .SRT &amp; .VTT download
                </li>
              </ul>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Current Plan
            </button>
          </div>

          {/* Card 2: Pro Creator (Highlighted Most Popular) */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid var(--blue)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(52, 119, 242, 0.15)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--blue)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                padding: '3px 12px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
              }}
            >
              ★ MOST POPULAR
            </span>

            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase' }}>
                CREATOR PRO
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>Pro Creator</h3>
              <div style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 16px', color: '#0f172a' }}>
                $14 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ month</span>
              </div>

              <ul style={{ padding: 0, margin: '0 0 20px', listStyle: 'none', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Check size={14} color="var(--blue)" /> 1,500 monthly credits
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Check size={14} color="var(--blue)" /> 200 MB max video upload
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="var(--blue)" /> 1080p &amp; 4K MP4 exports
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="var(--blue)" /> All 15+ creator animation presets
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="var(--blue)" /> Zero watermark
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(proPriceId)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--blue)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(52, 119, 242, 0.3)',
              }}
            >
              Get Pro ($14/mo) ⚡
            </button>
          </div>

          {/* Card 3: Team / Studio */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                AGENCY & TEAM
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>Team / Studio</h3>
              <div style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 16px' }}>
                $39 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ month</span>
              </div>

              <ul style={{ padding: 0, margin: '0 0 20px', listStyle: 'none', fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Check size={14} color="#166534" /> 5,000 monthly credits
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  <Check size={14} color="#166534" /> 500 MB max video upload
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> Priority cloud render speed
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> Custom brand fonts &amp; kits
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} color="#166534" /> 5 team seats included
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout(teamPriceId)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                background: '#0f172a',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Get Studio ($39/mo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
