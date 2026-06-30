import React, { useState, useEffect, useRef } from 'react';
import { auth, GoogleAuthProvider, isConfigured } from '../firebase';
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import './LoginScreen.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function LoginScreen({ onLoginSuccess, onCancel }) {
  const [activeTab, setActiveTab] = useState('phone'); // 'phone' or 'email'
  
  // Custom Email/Password Login
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Phone Auth States
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'verify'
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  // Statuses
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [simActive, setSimActive] = useState(!isConfigured); // Active if firebase is not setup
  
  // Refs
  const canvasRef = useRef(null);
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);
  const otpInputsRef = useRef([]);

  // ─── BACKGROUND CANVAS ANIMATION (VIDEO-VIBE) ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.glowColor = Math.random() > 0.5 ? 'rgba(255, 215, 0,' : 'rgba(58, 18, 94,';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glowColor + ' 0.8)';
        ctx.fillStyle = this.glowColor + this.alpha + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Grid nodes for fluid wave simulation
    const particles = Array.from({ length: 45 }, () => new Particle());
    let time = 0;

    const resizeHandler = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeHandler);

    // Dynamic wave paths in backdrop
    const drawWave = (offsetY, amplitude, frequency, color, lineWidth) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      for (let x = 0; x < width; x++) {
        const y = offsetY + Math.sin(x * frequency + time) * amplitude * Math.cos(x * 0.001 + time * 0.5);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Render loop
    const render = () => {
      // Semi-transparent wash to create glow paths trailing
      ctx.fillStyle = 'rgba(13, 4, 19, 0.08)';
      ctx.fillRect(0, 0, width, height);

      time += 0.005;

      // Draw flowing background energy ribbons
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(58, 18, 94, 0.4)';
      drawWave(height * 0.35, 40, 0.003, 'rgba(58, 18, 94, 0.15)', 4);
      
      ctx.shadowColor = 'rgba(255, 215, 0, 0.2)';
      drawWave(height * 0.65, 30, 0.002, 'rgba(255, 215, 0, 0.08)', 3);
      
      ctx.shadowColor = 'rgba(0, 255, 255, 0.25)';
      drawWave(height * 0.5, 25, 0.005, 'rgba(0, 255, 255, 0.06)', 2);

      // Draw floating space stars
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  // ─── RESEND OTP TIMER ───
  useEffect(() => {
    let interval;
    if (step === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // ─── SYNC USER PROFILE TO BACKEND ───
  const syncWithBackend = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/oauth-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.token) {
        // Store session tokens locally
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminId', data.data.profile.id || data.data.profile._id);
        localStorage.setItem('userName', data.data.profile.name || '');
        localStorage.setItem('userHandle', data.data.profile.email?.split('@')[0] || '');
        localStorage.setItem('userAvatar', data.data.profile.avatar_url || '');
        
        // Execute callback
        if (onLoginSuccess) onLoginSuccess(data.data.token, data.data.profile);
      } else {
        throw new Error(data.error || 'Backend synchronization failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Server connection failed.');
    }
  };

  // ─── GOOGLE LOGIN ───
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    if (simActive) {
      // Simulate Google Sign-In
      setTimeout(async () => {
        const dummyUID = 'google_' + Math.random().toString(36).slice(2, 10);
        const dummyPayload = {
          uid: dummyUID,
          name: 'PREETAM SINGH YADAV',
          email: 'preetam.yadav@ramlalanand.edu',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        };
        await syncWithBackend(dummyPayload);
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const payload = {
        uid: user.uid,
        name: user.displayName || 'OAuth User',
        email: user.email || '',
        avatar_url: user.photoURL || '',
      };

      await syncWithBackend(payload);
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setErrorMsg(err.message || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── INITIALIZE RECAPTCHA VERIFIER ───
  const initRecaptcha = () => {
    if (simActive || recaptchaVerifierRef.current) return;
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, direct flow will trigger SMS
        },
        'expired-callback': () => {
          setErrorMsg('reCAPTCHA expired. Please try again.');
        }
      });
    } catch (e) {
      console.error("Captcha init error:", e);
    }
  };

  // ─── PHONE: REQUEST OTP ───
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneNumber) return;
    
    setLoading(true);
    const fullNumber = `${countryCode}${phoneNumber}`;

    if (simActive) {
      setTimeout(() => {
        setStep('verify');
        setResendTimer(30);
        setLoading(false);
        console.log(`[Simulator Mode] OTP SMS sent to: ${fullNumber}. Use OTP: 123456`);
        alert(`[Simulator Mode] Verification Code Sent to ${fullNumber}. Use code "123456" to log in.`);
      }, 1200);
      return;
    }

    try {
      initRecaptcha();
      const appVerifier = recaptchaVerifierRef.current;
      const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep('verify');
      setResendTimer(30);
    } catch (err) {
      console.error('Phone SMS request failed:', err);
      setErrorMsg(err.message || 'Failed to send SMS code.');
      if (recaptchaVerifierRef.current) {
        // Reset Captcha widget
        try { recaptchaVerifierRef.current.clear(); recaptchaVerifierRef.current = null; } catch(e){}
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── PHONE: VERIFY OTP ───
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    const code = otpValues.join('');
    if (code.length !== 6) return;

    setLoading(true);

    if (simActive) {
      setTimeout(async () => {
        if (code === '123456') {
          const dummyUID = 'phone_' + Math.random().toString(36).slice(2, 10);
          const fullNumber = `${countryCode}${phoneNumber}`;
          const dummyPayload = {
            uid: dummyUID,
            name: `User ${fullNumber}`,
            phoneNumber: fullNumber,
            avatar_url: '',
          };
          await syncWithBackend(dummyPayload);
        } else {
          setErrorMsg('Invalid verification code. Try "123456" in Simulator.');
        }
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      const payload = {
        uid: user.uid,
        name: `User ${user.phoneNumber}`,
        phoneNumber: user.phoneNumber || '',
        avatar_url: '',
      };

      await syncWithBackend(payload);
    } catch (err) {
      console.error('OTP code verification failed:', err);
      setErrorMsg('Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL: FORM LOGIN ───
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      
      if (res.ok && data.data && data.data.token) {
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminId', data.data.profile.id || data.data.profile._id);
        localStorage.setItem('userName', data.data.profile.name || '');
        localStorage.setItem('userHandle', data.data.profile.email?.split('@')[0] || '');
        localStorage.setItem('userAvatar', data.data.profile.avatar_url || '');
        
        if (onLoginSuccess) onLoginSuccess(data.data.token, data.data.profile);
      } else {
        setErrorMsg(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setErrorMsg('Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP DIGIT INPUT MOVEMENT ───
  const handleOtpChange = (val, idx) => {
    if (isNaN(val)) return;
    
    const newOtp = [...otpValues];
    newOtp[idx] = val;
    setOtpValues(newOtp);

    // Advance to next box automatically
    if (val && idx < 5) {
      otpInputsRef.current[idx + 1].focus();
    }

    // Auto submit if complete
    if (newOtp.join('').length === 6) {
      // Give a tiny buffer so state updates
      setTimeout(() => {
        setErrorMsg('');
        // Trigger verification directly
        const completeCode = newOtp.join('');
        setLoading(true);
        if (simActive) {
          setTimeout(async () => {
            if (completeCode === '123456') {
              const dummyUID = 'phone_' + Math.random().toString(36).slice(2, 10);
              const fullNumber = `${countryCode}${phoneNumber}`;
              await syncWithBackend({
                uid: dummyUID,
                name: `User ${fullNumber}`,
                phoneNumber: fullNumber,
                avatar_url: '',
              });
            } else {
              setErrorMsg('Invalid verification code. Try "123456" in Simulator.');
            }
            setLoading(false);
          }, 1200);
        } else {
          confirmationResult.confirm(completeCode)
            .then(async (result) => {
              await syncWithBackend({
                uid: result.user.uid,
                name: `User ${result.user.phoneNumber}`,
                phoneNumber: result.user.phoneNumber || '',
                avatar_url: '',
              });
            })
            .catch(() => {
              setErrorMsg('Invalid verification code.');
              setLoading(false);
            });
        }
      }, 50);
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpInputsRef.current[idx - 1].focus();
    }
  };

  return (
    <div className="login-screen-overlay fade-in">
      <canvas ref={canvasRef} className="login-canvas-bg" />
      <div className="login-vibe-grid" />
      <div className="login-glow-orb login-glow-1" />
      <div className="login-glow-orb login-glow-2" />

      {simActive && (
        <div className="login-sim-banner">
          <span className="sim-pulse">●</span> Simulator Mode Active
        </div>
      )}

      {/* Embedded Recaptcha Invisible container */}
      <div ref={recaptchaRef} className="login-captcha-container" />

      <div className="login-glass-card">
        {onCancel && (
          <button 
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
          >
            ✕
          </button>
        )}

        <div className="login-brand">
          <h1 className="login-logo-glow">Seen.Ly</h1>
          <p className="login-subtitle">Campus Creator Space</p>
        </div>

        {errorMsg && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '12px',
            color: '#ff453a',
            fontSize: '12px',
            fontWeight: 600,
            padding: '10px 14px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {/* REQUEST OTP STEP */}
        {step === 'request' && (
          <>
            <div className="login-tabs">
              <button 
                onClick={() => setActiveTab('phone')}
                className={`login-tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
              >
                Phone OTP
              </button>
              <button 
                onClick={() => setActiveTab('email')}
                className={`login-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
              >
                Email
              </button>
            </div>

            {activeTab === 'phone' ? (
              <form onSubmit={handleRequestOtp} className="login-form-panel">
                <div className="login-phone-row">
                  <select 
                    value={countryCode} 
                    onChange={e => setCountryCode(e.target.value)}
                    className="login-country-select"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+971">🇦🇪 +971</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    required
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="login-input"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || phoneNumber.length < 10} 
                  className="login-submit-btn"
                >
                  {loading ? <span className="login-spinner" /> : null}
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailLogin} className="login-form-panel">
                <input
                  type="email"
                  placeholder="Email / Username"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="login-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="login-submit-btn"
                >
                  {loading ? <span className="login-spinner" /> : null}
                  Login
                </button>
              </form>
            )}

            <div className="login-divider">or connect via</div>

            <button 
              onClick={handleGoogleLogin} 
              disabled={loading} 
              className="login-google-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Sign In with Google
            </button>
          </>
        )}

        {/* VERIFY OTP STEP */}
        {step === 'verify' && (
          <div className="login-form-panel">
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Verification code sent to
              </p>
              <p style={{ margin: '4px 0 16px 0', fontSize: '15px', fontWeight: 800, color: '#FFD700' }}>
                {countryCode} {phoneNumber}
              </p>
            </div>

            <div className="login-otp-grid">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpInputsRef.current[idx] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, idx)}
                  onKeyDown={e => handleOtpKeyDown(e, idx)}
                  className="login-otp-box"
                  disabled={loading}
                />
              ))}
            </div>

            <button 
              onClick={handleVerifyOtp}
              disabled={loading || otpValues.join('').length < 6}
              className="login-submit-btn"
            >
              {loading ? <span className="login-spinner" /> : null}
              Verify & Sign In
            </button>

            <div className="login-timer-row">
              <button 
                onClick={() => setStep('request')}
                className="login-resend-btn"
                style={{ color: '#ff6b6b' }}
                disabled={loading}
              >
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span>Resend OTP in {resendTimer}s</span>
              ) : (
                <button 
                  onClick={handleRequestOtp}
                  className="login-resend-btn"
                  disabled={loading}
                >
                  Resend SMS
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
