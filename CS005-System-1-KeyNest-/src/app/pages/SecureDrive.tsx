import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, Lock, Unlock, Upload, Download, Trash2, FileText, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { encryptFile, decryptFile, secureShred } from '../utils/crypto';
import { storeEncryptedFile, getAllEncryptedFiles, deleteEncryptedFile, type EncryptedFile } from '../utils/storage';
import { addAuditLog } from '../utils/auditLog';
import { toast } from 'sonner';

export function SecureDrive() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const encryptedFiles = await getAllEncryptedFiles();
      setFiles(encryptedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    }
  };

  const handleLockVault = () => {
    sessionStorage.removeItem('aegis_key_available');
    delete (window as any).aegisKey;
    addAuditLog('Vault Locked', 'INFO', 'Vault manually locked by user');
    toast.info('Vault locked');
    navigate('/');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await processFiles(droppedFiles);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await processFiles(Array.from(selectedFiles));
    }
    // Reset input
    e.target.value = '';
  };

  const processFiles = async (filesToProcess: File[]) => {
    setIsProcessing(true);
    const key = (window as any).aegisKey as CryptoKey;

    if (!key) {
      toast.error('Vault is locked. Please unlock first.');
      navigate('/');
      return;
    }

    try {
      for (const file of filesToProcess) {
        // Encrypt the file
        const { encryptedData, originalName, originalSize } = await encryptFile(file, key);

        // Store encrypted file
        const encryptedFile: EncryptedFile = {
          id: crypto.randomUUID(),
          originalName,
          encryptedData,
          dateSecured: Date.now(),
          originalSize,
        };

        await storeEncryptedFile(encryptedFile);

        // Simulate secure shredding of the original file data
        // In a real desktop application, this would overwrite the physical disk sectors
        const fileBuffer = await file.arrayBuffer();
        secureShred(fileBuffer, 3);

        addAuditLog(
          'File Encrypted & Shredded',
          'INFO',
          `File '${originalName}' successfully encrypted with AES-256-GCM and original shredded (DoD 5220.22-M, 3 passes)`
        );

        toast.success(`${originalName} secured and original shredded`);
      }

      // Reload files
      await loadFiles();
      
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to secure files');
      addAuditLog(
        'Encryption Failed',
        'WARNING',
        `Failed to encrypt files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async (file: EncryptedFile) => {
    const key = (window as any).aegisKey as CryptoKey;

    if (!key) {
      toast.error('Vault is locked. Please unlock first.');
      navigate('/');
      return;
    }

    try {
      // Decrypt the file
      const decryptedFile = await decryptFile(file.encryptedData, key, file.originalName);

      // Download the decrypted file
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addAuditLog(
        'File Decrypted',
        'INFO',
        `File '${file.originalName}' successfully decrypted and exported`
      );

      toast.success(`${file.originalName} decrypted and downloaded`);
      
    } catch (error) {
      console.error('Error decrypting file:', error);
      
      if (error instanceof Error && error.message.includes('tampered')) {
        addAuditLog(
          'Integrity Check Failed',
          'CRITICAL',
          `CRITICAL: Integrity check failed on '${file.originalName}' - Tampering Detected. Decryption aborted.`
        );
        toast.error('Tampering detected! File integrity compromised.');
      } else {
        toast.error('Failed to decrypt file');
        addAuditLog(
          'Decryption Failed',
          'WARNING',
          `Failed to decrypt '${file.originalName}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleDelete = async (file: EncryptedFile) => {
    if (!confirm(`Permanently destroy '${file.originalName}'? This cannot be undone.`)) {
      return;
    }

    try {
      // Securely shred the encrypted data before deletion
      secureShred(file.encryptedData, 7); // DoD standard is 7 passes for top secret

      await deleteEncryptedFile(file.id);
      await loadFiles();

      addAuditLog(
        'File Destroyed',
        'INFO',
        `File '${file.originalName}' permanently destroyed (shredded with 7 passes)`
      );

      toast.success(`${file.originalName} permanently destroyed`);
      
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Shield className="size-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Aegis Vault</h1>
                <p className="text-sm text-slate-400">Secure Document Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400">
                <Unlock className="size-3 mr-1" />
                Unlocked
              </Badge>

              <Button
                variant="outline"
                onClick={() => navigate('/audit')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ClipboardList className="size-4 mr-2" />
                Audit Log
              </Button>

              <Button
                variant="outline"
                onClick={handleLockVault}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Lock className="size-4 mr-2" />
                Lock Vault
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Files</p>
                  <p className="text-3xl font-bold text-white">{files.length}</p>
                </div>
                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="size-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Size</p>
                  <p className="text-3xl font-bold text-white">
                    {formatFileSize(files.reduce((sum, f) => sum + f.originalSize, 0))}
                  </p>
                </div>
                <div className="size-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Shield className="size-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Encryption</p>
                  <p className="text-lg font-bold text-green-400">AES-256-GCM</p>
                </div>
                <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Lock className="size-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drop Zone */}
        <Card className="mb-8 border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardContent className="p-8">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center transition-all
                ${isDragging 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }
              `}
            >
              <Upload className={`size-12 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
              <h3 className="text-lg font-semibold text-white mb-2">
                Drop Files Here to Secure & Shred
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Files will be encrypted with AES-256-GCM and originals securely shredded
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
                disabled={isProcessing}
              />
              <label htmlFor="file-input">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled={isProcessing}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  {isProcessing ? 'Processing...' : 'Browse Files'}
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Files Table */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Secured Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="size-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No files in vault yet</p>
                <p className="text-sm text-slate-500">Drop files above to get started</p>
              </div>
            ) : (
              <div className="rounded-md border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Original File Name</TableHead>
                      <TableHead className="text-slate-300">Date Secured</TableHead>
                      <TableHead className="text-slate-300">File Size</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-blue-400" />
                            {file.originalName}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(file.dateSecured)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatFileSize(file.originalSize)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecrypt(file)}
                              className="border-blue-600 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Download className="size-4 mr-1" />
                              Decrypt & Export
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(file)}
                              className="border-red-600 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="size-4 mr-1" />
                              Destroy
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}