import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Shield, ArrowLeft, AlertTriangle, Info, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { getAuditLogs, formatTimestamp, clearAuditLogs, type AuditLogEntry } from '../utils/auditLog';
import { toast } from 'sonner';

export function AuditLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const auditLogs = getAuditLogs();
    setLogs(auditLogs);
  };

  const handleClearLogs = () => {
    if (!confirm('Clear all audit logs? This cannot be undone.')) {
      return;
    }

    clearAuditLogs();
    loadLogs();
    toast.success('Audit logs cleared');
  };

  const getSeverityIcon = (severity: AuditLogEntry['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="size-4 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="size-4 text-yellow-400" />;
      case 'INFO':
        return <Info className="size-4 text-blue-400" />;
    }
  };

  const getSeverityBadge = (severity: AuditLogEntry['severity']) => {
    const variants: Record<AuditLogEntry['severity'], string> = {
      CRITICAL: 'border-red-500/50 bg-red-500/10 text-red-400',
      WARNING: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
      INFO: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    };

    return (
      <Badge variant="outline" className={variants[severity]}>
        {severity}
      </Badge>
    );
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
                <h1 className="text-xl font-bold text-white">System Audit Log</h1>
                <p className="text-sm text-slate-400">Cryptographic Event Tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/vault')}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Vault
              </Button>

              <Button
                variant="outline"
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="border-red-600 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="size-4 mr-2" />
                Clear Logs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Audit Events ({logs.length})</CardTitle>
            <CardDescription className="text-slate-400">
              Read-only chronological record of all cryptographic operations and security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Info className="size-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No audit logs yet</p>
                <p className="text-sm text-slate-500">Events will appear here as they occur</p>
              </div>
            ) : (
              <div className="rounded-md border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300 w-[180px]">Timestamp</TableHead>
                      <TableHead className="text-slate-300 w-[120px]">Severity</TableHead>
                      <TableHead className="text-slate-300 w-[200px]">Event</TableHead>
                      <TableHead className="text-slate-300">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-300 font-mono text-sm">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(log.severity)}
                        </TableCell>
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(log.severity)}
                            {log.event}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Panel */}
        <Card className="mt-8 border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-base">About Audit Logging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <div className="flex gap-3">
              <Info className="size-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-slate-300">INFO events</strong> - Normal operations such as file encryption, decryption, vault unlock/lock
              </div>
            </div>
            <div className="flex gap-3">
              <AlertTriangle className="size-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-slate-300">WARNING events</strong> - Failed operations or authentication attempts
              </div>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="size-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-slate-300">CRITICAL events</strong> - Security violations such as integrity check failures (tampering detected)
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p>
                Audit logs are stored locally in browser storage and provide accountability 
                for all cryptographic operations in accordance with Information Assurance principles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
