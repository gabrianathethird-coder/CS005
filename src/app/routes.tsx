import { createBrowserRouter } from 'react-router';
import Home from './pages/Home';
import Encode from './pages/Encode';
import Decode from './pages/Decode';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Home,
  },
  {
    path: '/encode',
    Component: Encode,
  },
  {
    path: '/decode',
    Component: Decode,
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl mb-4 text-white">404 - Page Not Found</h1>
          <p className="text-slate-400 mb-6">The page you're looking for doesn't exist.</p>
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">
            Return to Home
          </a>
        </div>
      </div>
    ),
  },
]);
