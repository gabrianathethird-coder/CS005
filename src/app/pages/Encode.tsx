import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Upload, Image as ImageIcon, Download, Copy, Check, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { encryptText, calculateHash, blobToUint8Array } from '../utils/crypto';
import { embedDataInImage, validateImageFormat } from '../utils/steganography';

export default function Encode() {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [secretMessage, setSecretMessage] = useState('');
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [stegoImage, setStegoImage] = useState<Blob | null>(null);
  const [imageHash, setImageHash] = useState('');
  const [hashCopied, setHashCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageFormat(file)) {
      setError('Please upload a PNG or BMP image for lossless embedding.');
      return;
    }

    setCoverImage(file);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!coverImage || !secretMessage.trim() || !password) {
      setError('Please provide all required fields: image, message, and password.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Step 1: Encrypt the message
      const encryptedData = await encryptText(secretMessage, password);
      
      // Step 2: Embed into image
      const stegoBlob = await embedDataInImage(coverImage, encryptedData);
      
      // Step 3: Calculate hash
      const imageBytes = await blobToUint8Array(stegoBlob);
      const hash = await calculateHash(imageBytes);
      
      setStegoImage(stegoBlob);
      setImageHash(hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate stego-image');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!stegoImage) return;

    const url = URL.createObjectURL(stegoImage);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stego-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyHash = async () => {
    if (!imageHash) return;
    
    await navigator.clipboard.writeText(imageHash);
    setHashCopied(true);
    setTimeout(() => setHashCopied(false), 2000);
  };

  const handleReset = () => {
    setCoverImage(null);
    setImagePreview('');
    setSecretMessage('');
    setPassword('');
    setStegoImage(null);
    setImageHash('');
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
            <Lock className="w-8 h-8 text-lime-500" />
            Encode Workspace
          </h1>
          <p className="text-stone-300">Encrypt and hide your secret message inside an image</p>
        </div>

        {!stegoImage ? (
          <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Create Steganographic Image</CardTitle>
              <CardDescription className="text-stone-300">
                Upload a cover image, enter your secret message, and set an encryption password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="cover-image" className="text-white">Cover Image (PNG/BMP only)</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    id="cover-image"
                    type="file"
                    accept=".png,.bmp,image/png,image/bmp,image/x-ms-bmp"
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
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <Label className="text-white">Image Preview</Label>
                  <div className="border-2 border-stone-600/40 rounded-lg p-4 bg-stone-900/50">
                    <img 
                      src={imagePreview} 
                      alt="Cover" 
                      className="max-w-full max-h-64 mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="secret-message" className="text-white">Secret Message</Label>
                <Textarea
                  id="secret-message"
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Enter the secret text you want to hide..."
                  className="min-h-32 bg-stone-700/50 border-stone-600 text-white placeholder:text-stone-500"
                />
                <p className="text-sm text-stone-500">{secretMessage.length} characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">ChaCha20 Encryption Key</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password..."
                  className="bg-stone-700/50 border-stone-600 text-white placeholder:text-stone-500"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={processing || !coverImage || !secretMessage.trim() || !password}
                className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white shadow-lg font-semibold"
                size="lg"
              >
                {processing ? 'Processing...' : 'Generate Stego-Image'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-stone-800/70 border-stone-600/40 shadow-2xl shadow-black/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-lime-500" />
                  Steganographic Image Generated
                </CardTitle>
                <CardDescription className="text-stone-300">
                  Your secret message has been encrypted and embedded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-lime-500 to-yellow-500 hover:from-lime-600 hover:to-yellow-600 text-white shadow-lg font-semibold"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Secure Image
                </Button>
              </CardContent>
            </Card>

            <Alert className="bg-amber-900/30 border-amber-600 backdrop-blur-sm">
              <AlertDescription className="text-amber-200">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <ImageIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="mb-2"><strong>SHA-256 Integrity Hash:</strong></p>
                      <div className="bg-stone-900/80 p-3 rounded border border-stone-700 font-mono text-sm break-all">
                        {imageHash}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyHash}
                      variant="outline"
                      size="sm"
                      className="border-amber-600 text-amber-200 hover:bg-amber-900/40 hover:border-amber-500 transition-all"
                    >
                      {hashCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Hash
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm mt-2 text-stone-300">
                    Share this hash securely with the receiver. They can use it to verify the image hasn't been tampered with.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-stone-600 text-white hover:bg-stone-700/50 hover:border-lime-500 transition-all"
            >
              Encode Another Message
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}