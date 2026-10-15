'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

import { useAuth } from '@/components/AuthProvider';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { userProfile: currentUser } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Dodo Payments hosted checkout — session created server-side so the
  // webhook can credit the signed-in user (uid rides in checkout metadata).
  const handleCheckout = async (planId: 'pro' | 'team') => {
    setCheckoutError(null);
    if (!currentUser) {
      setCheckoutError('Sign in to your account before choosing a paid plan.');
      return;
    }

    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Checkout failed');
      }
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setCheckoutError(
        err instanceof Error ? err.message : 'Could not start checkout. Please try again.',
      );
      setCheckoutLoading(null);
    }
  };

  const proPriceId = 'pro';
  const teamPriceId = 'team';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Upgrade your Capgen plan"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '24px',
        padding: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        position: 'relative',
        color: '#0f172a',
      }}
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
          borderRadius: '999px',
          width: '60px',
          height: '44px',
          fontSize: '12px',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        Close
      </button>

      {/* Modal Header */}
      <div
        style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 24px', padding: '0 10px' }}
      >
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
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 900,
            margin: '12px 0 6px',
            letterSpacing: '-0.03em',
          }}
        >
          Choose a plan for your video output
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          Compare upload limits and video credits. Captioned video and SRT exports have no Capgen
          watermark.
        </p>
        {checkoutError && (
          <p style={{ color: '#dc2626', fontSize: '12px', margin: '12px 0 0', fontWeight: 600 }}>
            {checkoutError}
          </p>
        )}
      </div>

      {/* 3 Pricing Cards Grid - Responsive Auto-fit */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
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
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              STARTER
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>Free Tier</h3>
            <div style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 16px' }}>
              $0{' '}
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ forever</span>
            </div>

            <ul
              style={{
                padding: 0,
                margin: '0 0 20px',
                listStyle: 'none',
                fontSize: '13px',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                5 free video exports
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                100 MB max video upload
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Basic presets</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                SRT subtitle download
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
            FOR REGULAR PUBLISHING
          </span>

          <div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: 'var(--blue)',
                textTransform: 'uppercase',
              }}
            >
              CREATOR PRO
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>Pro Creator</h3>
            <div
              style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 16px', color: '#0f172a' }}
            >
              $14{' '}
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ month</span>
            </div>

            <ul
              style={{
                padding: 0,
                margin: '0 0 20px',
                listStyle: 'none',
                fontSize: '13px',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                1,500 video credits
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                200 MB max video upload
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Captioned video and SRT export
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Caption presets and animations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>Zero watermark</li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout(proPriceId as 'pro')}
            disabled={checkoutLoading !== null}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '13px',
              cursor: checkoutLoading ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(52, 119, 242, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: checkoutLoading && checkoutLoading !== 'pro' ? 0.6 : 1,
            }}
          >
            {checkoutLoading === 'pro' ? <>Redirecting to secure checkout…</> : 'Get Pro ($14/mo)'}
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
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              AGENCY & TEAM
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 10px' }}>
              Team / Studio
            </h3>
            <div style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 16px' }}>
              $39{' '}
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ month</span>
            </div>

            <ul
              style={{
                padding: 0,
                margin: '0 0 20px',
                listStyle: 'none',
                fontSize: '13px',
                color: '#475569',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                5,000 video credits
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                500 MB max video upload
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                In-browser video export
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Custom fonts, colors and placement
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Restyle and re-export existing projects
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout(teamPriceId as 'team')}
            disabled={checkoutLoading !== null}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: checkoutLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: checkoutLoading && checkoutLoading !== 'team' ? 0.6 : 1,
            }}
          >
            {checkoutLoading === 'team' ? <>Redirecting…</> : 'Get Studio ($39/mo)'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
