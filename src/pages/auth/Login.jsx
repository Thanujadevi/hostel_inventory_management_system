import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Modal } from '../../components/common/Modal';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useData } from '../../context/DataContext';
import campusBg from '../../assets/campus.jpg';

export const Login = () => {
  const { loginWithCredentials, loginWithGoogleAdmin, sendSupplierOtp, loginSupplierWithOtp } = useAuth();
  const { mockApi, showToast, refreshAll } = useData();

  // Single unified input state
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  // OTP State for Supplier Flow
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [error, setError] = useState(null);

  // Google OAuth State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('24104063@nec.edu.in');

  // Input Focus Ref
  const primaryInputRef = useRef(null);
  const otpInputRef = useRef(null);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const [hasGoogleClient, setHasGoogleClient] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let attempts = 0;
    const initGoogleGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response?.credential) {
                const payload = parseJwt(response.credential);
                if (payload) {
                  loginWithGoogleAdmin({
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    sub: payload.sub
                  }).then(res => {
                    if (!res.success) setError(res.message);
                  });
                }
              }
            }
          });

          const googleBtnContainer = document.getElementById('google-admin-btn-container');
          if (googleBtnContainer && googleBtnContainer.children.length === 0) {
            window.google.accounts.id.renderButton(googleBtnContainer, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              shape: 'rectangular'
            });
            setHasGoogleClient(true);
          }
        } catch (err) {
          console.warn("Google GIS init attempt:", err);
        }
      }
      attempts++;
      if (attempts > 20) clearInterval(interval);
    };

    initGoogleGis();
    const interval = setInterval(initGoogleGis, 300);
    return () => clearInterval(interval);
  }, []);

  const handleDirectGoogleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn("Google OAuth error:", tokenResponse.error);
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await res.json();
                if (userInfo.email) {
                  const authRes = await loginWithGoogleAdmin({
                    email: userInfo.email,
                    name: userInfo.name || 'Google Admin',
                    picture: userInfo.picture,
                    sub: userInfo.sub
                  });
                  if (!authRes.success) setError(authRes.message);
                } else {
                  setError("Unable to retrieve email from Google account.");
                }
              } catch (err) {
                setError("Failed to fetch Google profile information.");
              }
            }
          }
        });
        // Triggers the exact Google Account Chooser window showing all logged in accounts on device
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        console.warn("OAuth Client init failed, opening fallback modal:", err);
        setIsGoogleModalOpen(true);
      }
    } else if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsGoogleModalOpen(true);
        }
      });
    } else {
      setIsGoogleModalOpen(true);
    }
  };

  useEffect(() => {
    if (!otpSent) {
      primaryInputRef.current?.focus();
    } else {
      otpInputRef.current?.focus();
    }
  }, [otpSent]);

  // Determine if input is a valid 10-digit Mobile Number (Indian mobile format: 6-9 followed by 9 digits)
  const isMobileNumber = (val) => {
    if (!val) return false;
    const trimmed = val.trim();
    // Allow +91, 91, or 0 prefix
    const cleaned = trimmed.replace(/^(\+91|91|0)/, '').replace(/\D/g, '');
    return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
  };

  const isMobile = isMobileNumber(loginInput);

  // Reset OTP state if user changes the phone number
  const handleInputChange = (e) => {
    setLoginInput(e.target.value);
    setError(null);
    if (otpSent) {
      setOtpSent(false);
      setInputOtp('');
      setGeneratedOtp('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isMobile) {
      if (!otpSent) {
        // Step 1: Send OTP
        const result = await sendSupplierOtp(loginInput);
        if (result.success) {
          setOtpSent(true);
          setGeneratedOtp(result.otp);
          showToast(result.message || `OTP sent successfully`, "info");
        } else {
          setError(result.message);
        }
      } else {
        // Step 2: Verify OTP
        const result = await loginSupplierWithOtp(loginInput, inputOtp, generatedOtp);
        if (!result.success) {
          setError(result.message);
        }
      }
    } else {
      // Password Login (For Staff Usernames & Non-mobile numeric User ID/Code)
      const result = await loginWithCredentials(loginInput, password);
      if (!result.success) {
        setError(result.message);
      }
    }
  };

  // Supplier Registration Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({
    txt_Store_Name: '',
    txt_Owner_Name: '',
    txt_Phone: '',
    txt_Email: ''
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanedPhone = (regData.txt_Phone || '').trim().replace(/^(\+91|91|0)/, '').replace(/\D/g, '');
    if (cleanedPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setError("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    try {
      await mockApi.saveSupplier({
        txt_Store_Name: regData.txt_Store_Name,
        txt_Owner_Name: regData.txt_Owner_Name,
        txt_Supplier_Name: regData.txt_Store_Name,
        txt_Contact_Person: regData.txt_Owner_Name,
        txt_Phone: cleanedPhone,
        txt_Email: regData.txt_Email || `${cleanedPhone}@supplier.com`,
        txt_Profile_Completed: 'N'
      });
      await refreshAll();
      showToast("Registration successful! OTP sent for login.", "success");
      setIsRegisterOpen(false);

      // Auto pre-fill registered phone number into single input and send OTP
      setLoginInput(cleanedPhone);

      const res = await sendSupplierOtp(cleanedPhone);
      if (res.success) {
        setOtpSent(true);
        setGeneratedOtp(res.otp);
        showToast(res.message || `OTP sent successfully`, "info");
      }

      setRegData({
        txt_Store_Name: '',
        txt_Owner_Name: '',
        txt_Phone: '',
        txt_Email: ''
      });
    } catch (err) {
      setError("Failed to register supplier account");
    }
  };

  return (
    <div 
      className="login-page-container"
      style={{
        background: `linear-gradient(135deg, rgba(15, 23, 42, 0.72) 0%, rgba(30, 41, 59, 0.82) 100%), url(${campusBg}) no-repeat center center / cover`
      }}
    >
      {/* Background ambient lighting glow */}
      <div className="login-page-ambient-glow" />

      {/* Theme Toggle in top-right corner */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="login-card">
        {/* Logo Section & College Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
          <div className="login-logo-wrapper">
            <Logo size={56} showText={false} />
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="login-college-tag">NATIONAL ENGINEERING COLLEGE</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: '4px', letterSpacing: '-0.4px' }}>
            Hostel Inventory System
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Sign in to access your portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'var(--color-danger-bg, #fee2e2)',
            color: 'var(--color-danger-text, #991b1b)',
            padding: '11px 14px',
            borderRadius: '12px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
          }}>
            <div>{error}</div>
            {error.includes('not registered') && (
              <button
                type="button"
                onClick={() => {
                  setRegData(prev => ({ ...prev, txt_Phone: loginInput }));
                  setIsRegisterOpen(true);
                  setError(null);
                }}
                style={{
                  marginTop: '10px',
                  backgroundColor: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(30, 64, 175, 0.3)'
                }}
              >
                + Register "{loginInput}" as New Supplier
              </button>
            )}
          </div>
        )}

        {/* Simulated OTP Banner */}
        {otpSent && (
          <div style={{
            backgroundColor: 'var(--color-primary-bg, #eff6ff)',
            color: 'var(--color-primary-text, #1e40af)',
            padding: '12px 14px',
            borderRadius: '12px',
            marginBottom: '18px',
            fontSize: '0.85rem',
            border: '1px solid var(--color-primary-border, #bfdbfe)',
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.12)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>
              OTP sent to +91 {loginInput}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Demo OTP: <strong style={{ fontSize: '1rem', letterSpacing: '2px', textDecoration: 'underline' }}>{generatedOtp}</strong> (or use 1234)
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {/* Primary Input (Auto-detects Mobile No vs Staff Username) */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <div style={{ marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem', margin: 0 }}>
                Username or Supplier Mobile Number
              </label>
            </div>

            <div className="login-input-wrapper">
              <span className="login-input-icon">
                {isMobile ? (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </span>
              <input
                ref={primaryInputRef}
                type="text"
                className="login-input"
                placeholder="Enter Username (Admin/Store) or Mobile No."
                required
                disabled={otpSent}
                value={loginInput}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Quick Demo Supplier Number Shortcuts */}
            {isMobile && !otpSent && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Demo Suppliers: {' '}
                <button
                  type="button"
                  onClick={() => { setLoginInput('9988776655'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: '0 4px' }}
                >
                  9988776655
                </button> | {' '}
                <button
                  type="button"
                  onClick={() => { setLoginInput('9876501234'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', padding: '0 4px' }}
                >
                  9876501234
                </button>
              </div>
            )}
          </div>

          {/* Conditional Field 1: OTP Input for Supplier Mobile Flow */}
          {isMobile && otpSent && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem', margin: 0 }}>
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setInputOtp(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Change Number
                </button>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  ref={otpInputRef}
                  type="text"
                  className="login-input"
                  placeholder="e.g. 123456"
                  required
                  maxLength={6}
                  style={{
                    letterSpacing: '4px',
                    fontWeight: 700,
                    fontSize: '1.05rem'
                  }}
                  value={inputOtp}
                  onChange={e => setInputOtp(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Conditional Field 2: Password Input (For Staff Username Only) */}
          {!isMobile && (
            <div className="form-group" style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem', margin: 0 }}>
                  Password
                </label>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  className="login-input"
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-btn-primary"
          >
            {isMobile ? (
              <>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {otpSent ? 'Verify OTP & Login' : 'Get OTP via Mobile'}
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Google OAuth Section (Clean Divider without Admin OAuth Sign In words) */}
        <div>
          <div className="login-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            onClick={handleDirectGoogleLogin}
            className="login-btn-google"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Supplier Registration CTA */}
        <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
            New Supplier?
          </p>
          <button
            type="button"
            className="login-btn-secondary"
            onClick={() => setIsRegisterOpen(true)}
          >
            Register as New Supplier
          </button>
        </div>
      </div>

      {/* Supplier Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Supplier Registration"
      >
        <form onSubmit={handleRegisterSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Mobile Number *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                +91
              </span>
              <input
                type="tel"
                className="form-control"
                required
                pattern="[0-9]{10}"
                placeholder="Enter 10-digit mobile number"
                value={regData.txt_Phone}
                onChange={e => setRegData({ ...regData, txt_Phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Contact Person Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Ramesh Kumar"
              value={regData.txt_Owner_Name}
              onChange={e => setRegData({ ...regData, txt_Owner_Name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Company / Firm Name *</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Apex Traders & Supplies"
              value={regData.txt_Store_Name}
              onChange={e => setRegData({ ...regData, txt_Store_Name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. contact@apextraders.com"
              value={regData.txt_Email}
              onChange={e => setRegData({ ...regData, txt_Email: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register & Request OTP</button>
          </div>
        </form>
      </Modal>

      {/* Google OAuth Modal for Admin */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Admin Sign In with Google"
      >
        <form onSubmit={handleDirectGoogleLogin}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '4px 0', color: 'var(--color-text-primary)' }}>Google OAuth Admin Login</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Sign in with your authorized Google Admin Email</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'var(--color-danger-bg, #fee2e2)',
              color: 'var(--color-danger-text, #991b1b)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              border: '1px solid var(--color-border)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Google Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. 24104063@nec.edu.in"
              required
              value={googleEmailInput}
              onChange={(e) => { setError(null); setGoogleEmailInput(e.target.value); }}
              style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsGoogleModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Sign In with Google
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
