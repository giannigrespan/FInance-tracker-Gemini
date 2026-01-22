import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { Wallet, ShieldAlert, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string, userName: string) => void;
}

const ALLOWED_EMAILS = [
  'gianni.grespan@gmail.com',
  '88laurap88@gmail.com'
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        const decoded: any = jwtDecode(credentialResponse.credential);
        const email = decoded.email;
        const name = decoded.name;

        if (ALLOWED_EMAILS.includes(email)) {
          onLoginSuccess(email, name);
        } else {
          setError("Access denied. Your email is not authorized to access FamilyFinance.");
        }
      } catch (err) {
        setError("Failed to process login information.");
        console.error(err);
      }
    }
  };

  const handleError = () => {
    setError("Login Failed. Please try again.");
  };

  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 backdrop-blur-sm">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">FamilyFinance AI</h1>
          <p className="text-indigo-100 text-sm">Smart tracking for smart couples</p>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-6">
          
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please sign in to access your dashboard.</p>
          </div>

          {error && (
            <div className="w-full bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3 text-red-600 text-sm">
              <ShieldAlert size={18} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="w-full flex justify-center py-2">
            {hasClientId ? (
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_blue"
                shape="pill"
                size="large"
                width="100%"
                text="continue_with"
              />
            ) : (
              <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100 w-full">
                <p className="text-amber-800 font-medium mb-1">Configuration Missing</p>
                <p className="text-xs text-amber-700">
                  Please add <code>GOOGLE_CLIENT_ID</code> to your environment variables or <code>vite.config.ts</code>.
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-400 mt-4">
            Restricted access • Authorized users only
          </div>
        </div>
      </div>
    </div>
  );
};