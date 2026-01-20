import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';
import { unifiedApiService } from '../services/unifiedApiService';

interface ApiStatusIndicatorProps {
  className?: string;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkApiStatus = async () => {
    try {
      setStatus('checking');
      await unifiedApiService.healthCheck();
      setStatus('online');
      setLastChecked(new Date());
    } catch (error) {
      setStatus('offline');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Wifi className="w-4 h-4 animate-pulse" />;
      case 'online':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-destructive" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      default:
        return <Wifi className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking API...';
      case 'online':
        return 'API Online';
      case 'offline':
        return 'API Offline';
      case 'error':
        return 'API Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-muted-foreground';
      case 'online':
        return 'text-success';
      case 'offline':
        return 'text-destructive';
      case 'error':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/50 backdrop-blur-sm border border-border/50 ${className}`}
    >
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {lastChecked && (
          <span className="text-xs text-muted-foreground">
            {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>
      <button
        onClick={checkApiStatus}
        className="ml-2 p-1 hover:bg-muted/50 rounded transition-colors"
        title="Refresh API status"
      >
        <motion.div
          animate={{ rotate: status === 'checking' ? 360 : 0 }}
          transition={{ duration: 1, repeat: status === 'checking' ? Infinity : 0 }}
        >
          <Wifi className="w-3 h-3" />
        </motion.div>
      </button>
    </motion.div>
  );
};

export default ApiStatusIndicator;
