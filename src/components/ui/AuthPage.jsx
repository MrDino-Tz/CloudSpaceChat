import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, GithubAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import './AuthPage.css';

// ─── Particle Canvas ────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let circles = [];
    let mouse = { x: 0, y: 0 };
    let animId;
    let w = 0, h = 0;

    const COLOR = [102, 102, 102];
    const QUANTITY = 120;
    const EASE = 20;
    const STATICITY = 50;
    const SIZE = 0.4;

    function resize() {
      w = container.offsetWidth;
      h = container.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
      circles = [];
      for (let i = 0; i < QUANTITY; i++) spawnCircle();
    }

    function spawnCircle() {
      circles.push({
        x: Math.random() * w, y: Math.random() * h,
        tx: 0, ty: 0,
        size: Math.floor(Math.random() * 2) + SIZE,
        alpha: 0,
        targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
        dx: (Math.random() - 0.5) * 0.1, dy: (Math.random() - 0.5) * 0.1,
        mag: 0.1 + Math.random() * 4,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      circles.forEach((c, i) => {
        const edge = [c.x + c.tx - c.size, w - c.x - c.tx - c.size, c.y + c.ty - c.size, h - c.y - c.ty - c.size];
        const closest = Math.min(...edge);
        c.alpha = closest > 20 ? Math.min(c.alpha + 0.02, c.targetAlpha) : c.targetAlpha * Math.min(closest / 20, 1);
        c.x += c.dx; c.y += c.dy;
        c.tx += (mouse.x / (STATICITY / c.mag) - c.tx) / EASE;
        c.ty += (mouse.y / (STATICITY / c.mag) - c.ty) / EASE;
        ctx.translate(c.tx, c.ty);
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR.join(',')},${c.alpha})`;
        ctx.fill();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (c.x < -c.size || c.x > w + c.size || c.y < -c.size || c.y > h + c.size) {
          circles.splice(i, 1); spawnCircle();
        }
      });
      animId = requestAnimationFrame(draw);
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left - w / 2;
      mouse.y = e.clientY - rect.top - h / 2;
    }

    resize(); draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMouseMove); };
  }, []);

  return (
    <div className="auth-particles" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const GridIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ChevronLeft = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const GoogleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.479 14.265v-3.279h11.049c.108.571.164 1.247.164 1.979 0 2.46-.672 5.502-2.84 7.669C18.744 22.829 16.051 24 12.483 24 5.869 24 .308 18.613.308 12S5.869 0 12.483 0c3.659 0 6.265 1.436 8.223 3.307L18.392 5.62c-1.404-1.317-3.307-2.341-5.913-2.341C7.65 3.279 3.873 7.171 3.873 12s3.777 8.721 8.606 8.721c3.132 0 4.916-1.258 6.059-2.401.927-.927 1.537-2.251 1.777-4.059L12.479 14.265z" />
  </svg>
);

const GithubIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.4 5.4 0 0 0-.1-3.7s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.4 5.4 0 0 0-.1 3.7 5.5 5.5 0 0 0-1.5 3.8c0 4.9 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const EyeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const XIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Credentials Modal ────────────────────────────────────────────────────────
function CredsModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title-row">
            <GridIcon style={{ width: 20, height: 20 }} />
            <span className="modal-brand">CloudSpaceChat</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <XIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="modal-body">
          <h2 className="modal-heading">{isRegister ? 'Create account' : 'Sign in with credentials'}</h2>
          <p className="modal-sub">Enter your email and password to continue.</p>

          {error && <p className="form-error">{error}</p>}

          <form className="creds-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password"
                >
                  {showPass ? <EyeOffIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn modal-submit-btn">
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button className="auth-creds-link" type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ marginTop: 12 }}>
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export function AuthPage() {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  const signInWithGoogle = async () => {
    try {
      setError('');
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  const signInWithGithub = async () => {
    try {
      setError('');
      await signInWithPopup(auth, new GithubAuthProvider());
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  return (
    <div className="auth-root">
      <ParticleCanvas />

      <div className="auth-glow" aria-hidden="true">
        <div className="auth-glow-1" />
        <div className="auth-glow-2" />
        <div className="auth-glow-3" />
      </div>

      <div className="auth-container">
        <a href="#" className="auth-back-btn">
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Home
        </a>

        <div className="auth-card">
          {/* Brand */}
          <div className="auth-brand">
            <img src={`${import.meta.env.BASE_URL}csclogo.png`} alt="CloudSpaceChat" className="auth-logo" />
            <p className="auth-brand-name">CloudSpaceChat</p>
          </div>

          {/* Heading */}
          <div className="auth-heading">
            <h1>Sign In or Join Now!</h1>
            <p>login or create your CloudSpaceChat account.</p>
          </div>

          {error && <p className="form-error">{error}</p>}

          {/* OAuth Buttons */}
          <div className="auth-buttons">
            <button className="auth-btn" type="button" onClick={signInWithGoogle}>
              <GoogleIcon style={{ width: 16, height: 16 }} />
              Continue with Google
            </button>
            <button className="auth-btn" type="button" onClick={signInWithGithub}>
              <GithubIcon style={{ width: 16, height: 16 }} />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or</span>
            <span className="auth-divider-line" />
          </div>

          {/* Type creds link */}
          <button
            className="auth-creds-link"
            type="button"
            onClick={() => setShowModal(true)}
          >
            type credentials instead
          </button>

          {/* Legal */}
          <p className="auth-legal">
            By clicking continue, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {showModal && <CredsModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
