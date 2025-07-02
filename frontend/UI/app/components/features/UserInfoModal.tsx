import React, { useState } from 'react';

const PLATFORMS = ['Instagram', 'WhatsApp', 'Meta', 'TikTok', 'Youtube', 'Etsy', 'Other'];

export default function UserInfoModal({ onSubmit }: { onSubmit: (info: any) => void }) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !platform) {
      setError('Name and Platform are required.');
      return;
    }
    if (platform === 'Other' && !customPlatform.trim()) {
      setError('Please specify the platform when selecting "Other".');
      return;
    }
    
    const finalPlatform = platform === 'Other' ? customPlatform : platform;
    onSubmit({ name, platform: finalPlatform, phone, email });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, pointerEvents: 'auto'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'rgba(255, 255, 255, 0.15)', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: 32, minWidth: 350, display: 'flex', flexDirection: 'column', gap: 16
        }}
      >
        <h2 style={{ marginBottom: 8, color: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>Please provide your information</h2>
        <label style={{ display: 'flex', flexDirection: 'column', color: 'rgba(255, 255, 255, 0.8)' }}>Name
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              marginTop: 4, 
              padding: '8px 12px', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }} 
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', color: 'rgba(255, 255, 255, 0.8)' }}>Platform
          <select 
            value={platform} 
            onChange={e => setPlatform(e.target.value)} 
            required 
            style={{ 
              width: '100%', 
              marginTop: 4, 
              padding: '8px 12px', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <option value="" style={{ background: '#1a1a1a', color: 'white' }}>Select a platform</option>
            {PLATFORMS.map(p => <option key={p} value={p} style={{ background: '#1a1a1a', color: 'white' }}>{p}</option>)}
          </select>
        </label>
        {platform === 'Other' && (
          <label style={{ display: 'flex', flexDirection: 'column', color: 'rgba(255, 255, 255, 0.8)' }}>Please specify
            <input 
              value={customPlatform} 
              onChange={e => setCustomPlatform(e.target.value)} 
              placeholder="Enter platform name..."
              required
              style={{ 
                width: '100%', 
                marginTop: 4, 
                padding: '8px 12px', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)'
              }} 
            />
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', color: 'rgba(255, 255, 255, 0.8)' }}>Phone Number
          <input 
            value={phone} 
            onChange={e => setPhone(e.target.value)} 
            type="tel"
            style={{ 
              width: '100%', 
              marginTop: 4, 
              padding: '8px 12px', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }} 
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', color: 'rgba(255, 255, 255, 0.8)' }}>Email Address
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email"
            style={{ 
              width: '100%', 
              marginTop: 4, 
              padding: '8px 12px', 
              border: '1px solid rgba(255, 255, 255, 0.2)', 
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }} 
          />
        </label>
        <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }}>
          We'll only use your contact information if we need to follow up on your request.
        </span>
        {error && <div style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</div>}
        <button type="submit" style={{
          background: 'rgba(37, 99, 235, 0.8)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 8, padding: '12px 0', fontSize: 16,
          cursor: 'pointer', backdropFilter: 'blur(10px)'
        }}>Submit</button>
      </form>
    </div>
  );
} 