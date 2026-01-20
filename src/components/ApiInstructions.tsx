import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Play, Copy, Check } from 'lucide-react';

interface ApiInstructionsProps {
  isVisible: boolean;
  onClose: () => void;
}

const ApiInstructions: React.FC<ApiInstructionsProps> = ({ isVisible, onClose }) => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const commands = [
    {
      title: 'Windows (Batch)',
      command: 'start-api.bat',
      description: 'Double-click the start-api.bat file'
    },
    {
      title: 'PowerShell',
      command: 'powershell -ExecutionPolicy Bypass -File start-api.ps1',
      description: 'Run in PowerShell'
    },
    {
      title: 'Manual Python',
      command: 'cd dragonfly && python unified_api.py',
      description: 'Run manually in terminal'
    }
  ];

  const copyToClipboard = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Start the API Server</h3>
                  <p className="text-sm text-muted-foreground">The satellite analysis API is not running</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn-icon btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Quick Start</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  To enable satellite analysis features, you need to start the unified API server.
                </p>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">Recommended: Use the provided scripts</span>
                </div>
              </div>

              <div className="space-y-3">
                {commands.map((cmd, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-foreground">{cmd.title}</h5>
                      <button
                        onClick={() => copyToClipboard(cmd.command)}
                        className="btn-icon btn-ghost"
                        title="Copy command"
                      >
                        {copiedCommand === cmd.command ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{cmd.description}</p>
                    <div className="bg-muted px-3 py-2 rounded font-mono text-sm text-foreground">
                      {cmd.command}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <h4 className="font-medium text-warning mb-2">Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Python 3.8+ installed</li>
                  <li>• Dependencies installed (pip install -r requirements.txt)</li>
                  <li>• Sentinel Hub credentials (optional, for real satellite data)</li>
                </ul>
              </div>

              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <h4 className="font-medium text-success mb-2">What You'll Get</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time satellite imagery analysis</li>
                  <li>• NDVI environmental insights</li>
                  <li>• AI-powered change detection</li>
                  <li>• Interactive visualizations</li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  API will be available at: <span className="font-mono text-foreground">http://localhost:8000</span>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApiInstructions;
