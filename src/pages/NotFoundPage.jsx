import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-gray-100 text-center">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/30 text-pink-500 flex items-center justify-center mx-auto animate-bounce">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-xl font-bold text-white">Lost Connection</h2>
          <p className="text-sm text-gray-400">
            The page or profile you are looking for has wandered into stranger mode or does not exist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/app">
            <Button variant="primary" fullWidth icon={Home}>
              Go to Home Feed
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" fullWidth icon={ArrowLeft}>
              Landing Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
