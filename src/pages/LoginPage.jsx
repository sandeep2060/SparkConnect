import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, Shield, User, ArrowRight, Phone } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('admin@sparkconnect.dev');
  const [password, setPassword] = useState('Admin123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/app';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'admin' && from === '/app') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (type) => {
    if (type === 'admin') {
      setEmail('admin@sparkconnect.dev');
      setPassword('Admin123!');
    } else {
      setEmail('alex.rivera@sparkconnect.com');
      setPassword('Demo123!');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Card */}
        <Card glass className="p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-pink-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
            <p className="text-xs text-gray-400">
              Sign in to your SparkConnect (LoveBook) account
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email or Phone Number"
              type="text"
              placeholder="you@example.com or +1 (555) 000-0000"
              icon={email.includes('@') ? Mail : Phone}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="Sign in with your registered email or phone"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-gray-900 border-gray-700 text-pink-500 focus:ring-pink-500/30"
                />
                <span>Remember me</span>
              </label>

              <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-pink-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div className="pt-4 border-t border-gray-800 space-y-2">
            <div className="text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Instant Demo Access
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('user')}
                className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-pink-400" />
                <span>Demo User</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-semibold text-purple-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-gray-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-pink-400 font-bold hover:underline">
            Join Free here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
