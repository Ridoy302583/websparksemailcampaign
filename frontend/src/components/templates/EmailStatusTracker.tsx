// components/EmailStatusTracker.tsx - Real-time email status tracking
import React, { useState, useEffect, useRef } from 'react';
import { useCampaignStore } from 'src/stores/campaignStore';
import { emailService } from 'src/services/emailService';

interface EmailStatus {
  email: string;
  status: 'pending' | 'starting' | 'sending' | 'success' | 'failed';
  timestamp: string;
  messageId?: string;
  error?: string;
}

export const EmailStatusTracker: React.FC = () => {
  const { currentJobId, sendingStatus, selectedContacts } = useCampaignStore();
  const [emailStatuses, setEmailStatuses] = useState<EmailStatus[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);

  useEffect(() => {
    if (currentJobId && (sendingStatus === 'sending' || sendingStatus === 'paused')) {
      startTracking();
      initializeEmailStatuses();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [currentJobId, sendingStatus]);

  const initializeEmailStatuses = () => {
    if (selectedContacts && selectedContacts.length > 0) {
      const initialStatuses: EmailStatus[] = selectedContacts.map((contact) => ({
        email: contact.email,
        status: 'pending',
        timestamp: new Date().toISOString()
      }));
      setEmailStatuses(initialStatuses);
      setCurrentEmailIndex(0);
      console.log(`📧 Initialized ${initialStatuses.length} email statuses for tracking`);
    }
  };

  const startTracking = () => {
    if (isTracking || !currentJobId) return;
    
    console.log('🔄 Starting real-time email status tracking');
    setIsTracking(true);
    
    // Simulate email progression every 3 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const result = await emailService.getJobStatus(currentJobId);
        if (result.success && result.job) {
          updateEmailStatuses(result.job);
        }
        
        // Real-time updates now come from backend job status
      } catch (error) {
        console.error('❌ Error tracking email status:', error);
      }
    }, 1500); // Faster updates for better real-time feel
  };

  // Remove the fake progression - now using real backend data

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    console.log('⏹️ Stopped email status tracking');
  };

  const updateEmailStatuses = (job: any) => {
    const newStatuses: EmailStatus[] = [];
    
    // Get all contacts from the store for initialization
    const allEmails = selectedContacts.map(contact => contact.email);
    
    // Initialize all emails as pending first
    allEmails.forEach(email => {
      newStatuses.push({
        email,
        status: 'pending',
        timestamp: new Date().toISOString()
      });
    });
    
    // Update with successful emails
    if (job.successfulEmails && Array.isArray(job.successfulEmails)) {
      job.successfulEmails.forEach((email: any) => {
        const index = newStatuses.findIndex(s => s.email === email.email);
        if (index !== -1) {
          newStatuses[index] = {
            email: email.email,
            status: 'success',
            timestamp: email.timestamp || new Date().toISOString(),
            messageId: email.messageId
          };
        }
      });
    }
    
    // Update with failed emails
    if (job.errors && Array.isArray(job.errors)) {
      job.errors.forEach((error: any) => {
        const index = newStatuses.findIndex(s => s.email === error.email);
        if (index !== -1) {
          newStatuses[index] = {
            email: error.email,
            status: 'failed',
            timestamp: error.timestamp,
            error: error.error
          };
        }
      });
    }
    
    // Update current email being processed
    if (job.currentEmail && job.status === 'running') {
      const currentIndex = newStatuses.findIndex(s => s.email === job.currentEmail);
      if (currentIndex !== -1 && newStatuses[currentIndex].status === 'pending') {
        // Check if this email is starting or sending
        const isAlreadyProcessed = job.successfulEmails?.some((e: any) => e.email === job.currentEmail) ||
                                  job.errors?.some((e: any) => e.email === job.currentEmail);
        
        if (!isAlreadyProcessed) {
          newStatuses[currentIndex] = {
            ...newStatuses[currentIndex],
            status: 'sending',
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    // Keep original order (don't sort by timestamp)
    setEmailStatuses(newStatuses);
  };

  const getStatusIcon = (status: EmailStatus['status']) => {
    switch (status) {
      case 'success':
        return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'starting':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></div>;
      case 'sending':
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>;
      case 'pending':
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-300 rounded-full"></div>;
    }
  };

  const getStatusText = (status: EmailStatus['status']) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'starting':
        return 'Starting';
      case 'sending':
        return 'Sending';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (!isTracking && emailStatuses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">Email Status Tracker</h4>
        {isTracking && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Live Tracking
          </div>
        )}
      </div>

      {emailStatuses.length === 0 && isTracking && (
        <div className="text-center py-8 text-gray-500">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
            <p>Waiting for email status updates...</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {emailStatuses.map((emailStatus, index) => (
          <div 
            key={`${emailStatus.email}-${index}`}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              emailStatus.status === 'success' 
                ? 'bg-green-50 border-green-200' 
                : emailStatus.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : emailStatus.status === 'starting'
                ? 'bg-yellow-50 border-yellow-200'
                : emailStatus.status === 'sending'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center flex-1 min-w-0">
              {getStatusIcon(emailStatus.status)}
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-900 truncate mr-2">
                    {emailStatus.email}
                  </p>
                  <span className="text-gray-400 mx-2">-----</span>
                  <p className={`text-sm font-medium ${
                    emailStatus.status === 'success' 
                      ? 'text-green-600' 
                      : emailStatus.status === 'failed'
                      ? 'text-red-600'
                      : emailStatus.status === 'starting'
                      ? 'text-yellow-600'
                      : emailStatus.status === 'sending'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {getStatusText(emailStatus.status)}
                  </p>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    {new Date(emailStatus.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {emailStatus.error && (
                  <p className="text-xs text-red-500 mt-1 truncate">
                    {emailStatus.error}
                  </p>
                )}
                {emailStatus.messageId && (
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">
                    ID: {emailStatus.messageId}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {emailStatuses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total: {emailStatuses.length}</span>
            <span>
              Success: {emailStatuses.filter(s => s.status === 'success').length} | 
              Failed: {emailStatuses.filter(s => s.status === 'failed').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
