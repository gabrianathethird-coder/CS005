import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Upload, Unlock, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { decryptText, calculateHash, blobToUint8Array } from '../utils/crypto';
import { extractDataFromImage } from '../utils/steganography';

export default function Decode() {
  const [stegoImage, setStegoImage] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [expectedHash, setExpectedHash] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [hashVerified, setHashVerified] = useState<boolean | null>(null);
  const [actualHash, setActualHash] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStegoImage(file);
    setError('');
  };

  const handleExtract = async () => {
    if (!stegoImage || !password) {
      setError('Please provide both the stego-image and decryption password.');
      return;
    }

    setProcessing(true);
    setError('');
    setDecryptedMessage('');
    setHashVerified(null);

    try {
      // Step 1: Calculate hash if expected hash is provided
      if (expectedHash.trim()) {
        const imageBytes = await blobToUint8Array(stegoImage);
        const hash = await calculateHash(imageBytes);
        setActualHash(hash);
        setHashVerified(hash.toLowerCase() === expectedHash.trim().toLowerCase());
      }

      // Step 2: Extract data from image
      const extractedData = await extractDataFromImage(stegoImage);
      
      // Step 3: Decrypt the data
      const plaintext = await decryptText(extractedData, password);
      
      setDecryptedMessage(plaintext);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid or corrupted')) {
        setError('No steganographic data found in this image, or the data is corrupted.');
      } else if (err instanceof Error && err.message.includes('UTF-8')) {
        setError('Decryption failed. Please check your password and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to extract and decrypt message');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStegoImage(null);
    setPassword('');
    setExpectedHash('');
    setDecryptedMessage('');
    setHashVerified(null);
    setActualHash('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative min-h-screen p-4 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/GreenBG.jpg')`,
        }}
      >
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-lime-400 hover:text-lime-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl mb-2 text-white flex items-center gap-3">
            <Unlock className="w-8 h-8 text-amber-500" />
            Decode Workspace
          </h1>
          <p className="text-stone-300">Extract and decrypt hidden messages from steganographic images</p>
        </div>

        <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Extract Hidden Message</CardTitle>
            <CardDescription className="text-stone-300">
              Upload a steganographic image and enter the decryption password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="stego-image" className="text-white">Stego-Image</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  id="stego-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-stone-700/50 border-stone-600 text-white file:bg-stone-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-2 hover:file:bg-stone-500"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-stone-600 text-white hover:bg-stone-700/50 hover:border-lime-500 transition-all"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {stegoImage && (
                <p className="text-sm text-stone-400">Selected: {stegoImage.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="decode-password" className="text-white">ChaCha20 Decryption Key</Label>
              <Input
                id="decode-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the password used during encoding..."
                className="bg-stone-700/50 border-stone-600 text-white placeholder:text-stone-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-hash" className="text-white">
                Expected SHA-256 Hash (Optional - For Integrity Check)
              </Label>
              <Input
                id="expected-hash"
                type="text"
                value={expectedHash}
                onChange={(e) => setExpectedHash(e.target.value)}
                placeholder="Paste the hash provided by the sender..."
                className="bg-stone-700/50 border-stone-600 text-white placeholder:text-stone-500 font-mono text-sm"
              />
              <p className="text-xs text-stone-500">
                If provided, the system will verify the image hasn't been tampered with
              </p>
            </div>

            <Button
              onClick={handleExtract}
              disabled={processing || !stegoImage || !password}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg font-semibold"
              size="lg"
            >
              {processing ? 'Processing...' : 'Extract & Decrypt Payload'}
            </Button>
          </CardContent>
        </Card>

        {hashVerified !== null && expectedHash.trim() && (
          <Alert className={hashVerified ? 'bg-lime-900/30 border-lime-600 mt-6' : 'bg-red-900/30 border-red-600 mt-6'}>
            <AlertDescription className={hashVerified ? 'text-lime-200' : 'text-red-200'}>
              <div className="flex items-start gap-3">
                {hashVerified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0 text-lime-400" />
                    <div>
                      <p className="mb-1"><strong>✓ Integrity Verified</strong></p>
                      <p className="text-sm">The image hash matches. No tampering detected.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-400" />
                    <div>
                      <p className="mb-1"><strong>⚠ Warning: Image Tampered/Corrupted</strong></p>
                      <p className="text-sm mb-2">The hash does not match. The image may have been modified or corrupted during transit.</p>
                      <details className="text-xs">
                        <summary className="cursor-pointer hover:underline mb-1">Show hash comparison</summary>
                        <div className="mt-2 space-y-1 font-mono bg-stone-900/80 p-2 rounded border border-stone-700">
                          <div>Expected: {expectedHash}</div>
                          <div>Actual: {actualHash}</div>
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {decryptedMessage && (
          <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 backdrop-blur-sm mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-lime-500" />
                Decrypted Secret Message
              </CardTitle>
              <CardDescription className="text-stone-300">
                The hidden payload has been successfully extracted and decrypted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-4">
                <Textarea
                  value={decryptedMessage}
                  readOnly
                  className="min-h-32 bg-transparent border-0 text-white resize-none focus-visible:ring-0"
                />
              </div>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-stone-600 text-white hover:bg-stone-700/50 hover:border-lime-500 transition-all"
              >
                Decode Another Image
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}