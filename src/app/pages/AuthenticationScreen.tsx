import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Lock, Key, FileKey, Eraser, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { deriveKeyFromPassword, generateSalt, saltToHex, hexToSalt } from '../utils/crypto';
import { addAuditLog } from '../utils/auditLog';
import { toast } from 'sonner';

const SALT_KEY = 'aegis_salt';
const VAULT_INITIALIZED_KEY = 'aegis_initialized';

// Password strength checker function
const checkPasswordStrength = (password: string): { strength: string; score: number; color: string } => {
  if (!password) {
    return { strength: '', score: 0, color: '' };
  }

  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Additional bonus for longer passwords with variety
  if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  
  // Determine strength based on score
  let strength = '';
  let color = '';
  
  if (score <= 2) {
    strength = 'Very Weak';
    color = 'bg-red-500';
  } else if (score <= 3) {
    strength = 'Weak';
    color = 'bg-orange-500';
  } else if (score <= 5) {
    strength = 'Moderate';
    color = 'bg-yellow-500';
  } else if (score <= 7) {
    strength = 'Strong';
    color = 'bg-green-500';
  } else {
    strength = 'Very Strong';
    color = 'bg-emerald-500';
  }
  
  return { strength, score: Math.min(score, 8), color };
};

export function AuthenticationScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const isFirstTime = !localStorage.getItem(VAULT_INITIALIZED_KEY);
  
  const passwordStrength = checkPasswordStrength(password);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    if (isFirstTime && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (isFirstTime && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      let salt: Uint8Array;

      if (isFirstTime) {
        // First time setup - generate new salt
        salt = generateSalt();
        localStorage.setItem(SALT_KEY, saltToHex(salt));
        localStorage.setItem(VAULT_INITIALIZED_KEY, 'true');
        
        addAuditLog(
          'Vault Initialized',
          'INFO',
          'Aegis Vault successfully initialized with new encryption key'
        );
      } else {
        // Existing vault - retrieve salt
        const saltHex = localStorage.getItem(SALT_KEY);
        if (!saltHex) {
          throw new Error('Vault configuration corrupted');
        }
        salt = hexToSalt(saltHex);
      }

      // Derive the encryption key from password
      const key = await deriveKeyFromPassword(password, salt);
      
      // Store the key in sessionStorage (cleared when browser closes)
      // Note: In production, consider using a more secure method
      sessionStorage.setItem('aegis_key_available', 'true');
      
      // Store key in memory via a global reference (not ideal but works for this context)
      (window as any).aegisKey = key;

      addAuditLog(
        'Vault Unlocked',
        'INFO',
        'Vault successfully unlocked and encryption key derived'
      );

      toast.success('Vault unlocked successfully');
      navigate('/vault');
      
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to unlock vault');
      addAuditLog(
        'Unlock Failed',
        'WARNING',
        `Failed to unlock vault: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6">
        {/* Left side - Authentication */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="size-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              Aegis Vault
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isFirstTime 
                ? 'Initialize your secure document vault with a strong password'
                : 'Enter your vault password to unlock'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Vault Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {isFirstTime && password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Password Strength:</span>
                      <span 
                        className={`font-semibold ${
                          passwordStrength.strength === 'Very Weak' ? 'text-red-400' :
                          passwordStrength.strength === 'Weak' ? 'text-orange-400' :
                          passwordStrength.strength === 'Moderate' ? 'text-yellow-400' :
                          passwordStrength.strength === 'Strong' ? 'text-green-400' :
                          'text-emerald-400'
                        }`}
                      >
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 8) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${password.length >= 8 ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span>At least 8 characters</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${/[a-z]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span>Lowercase letter</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span>Uppercase letter</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span>Number</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${/[^a-zA-Z0-9]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                        <span>Special character</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isFirstTime && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-200">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>
              )}

              {isFirstTime && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3">
                  <p className="text-sm text-blue-300">
                    <strong>Important:</strong> Your password is used to derive your encryption key via PBKDF2. 
                    It is never stored. If you forget it, your files cannot be recovered.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Processing...'
                ) : isFirstTime ? (
                  'Initialize Aegis Vault'
                ) : (
                  'Unlock Vault'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="size-4" />
                <span>AES-256-GCM | PBKDF2 | DoD 5220.22-M Shredding</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right side - Features */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Security Features</CardTitle>
            <CardDescription className="text-slate-300">
              Military-grade encryption for your sensitive documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FileKey className="size-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AES-256-GCM Encryption</h3>
                  <p className="text-sm text-slate-400">
                    Authenticated encryption ensures both confidentiality and integrity. 
                    Any tampering is immediately detected and decryption is refused.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-12 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Key className="size-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">PBKDF2 Key Derivation</h3>
                  <p className="text-sm text-slate-400">
                    Your password is mathematically transformed into a 256-bit encryption key 
                    using 100,000 iterations. Password is never stored anywhere.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="size-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Eraser className="size-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">DoD 5220.22-M Shredding</h3>
                  <p className="text-sm text-slate-400">
                    Original files are cryptographically overwritten multiple times before deletion, 
                    preventing forensic recovery of sensitive data.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-sm font-semibold text-white mb-2">How It Works</h4>
              <ol className="text-sm text-slate-400 space-y-2">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-semibold">1.</span>
                  <span>Enter your password to derive the encryption key</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-semibold">2.</span>
                  <span>Drag and drop files to encrypt and securely store</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-semibold">3.</span>
                  <span>Original files are shredded, encrypted copies saved</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-semibold">4.</span>
                  <span>Decrypt and export when needed with your password</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}