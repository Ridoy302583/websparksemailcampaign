// components/EmailProgressDashboard.tsx (Updated with real API data)
import React, { useEffect } from 'react';
import { useCampaignActions } from 'src/hooks/useCampaignActions';
import { useCampaignStore } from 'src/stores/campaignStore';
import { calculateProgress, formatDuration } from 'src/utils/campaignHelpers';

export const EmailProgressDashboard: React.FC = () => {
  const { emailProgress, sendingStatus, currentJobId } = useCampaignStore();
  const { checkJobStatus } = useCampaignActions();

  // Poll job status every 2 seconds when sending
  useEffect(() => {
    if (!currentJobId || sendingStatus !== 'sending') return;

    const interval = setInterval(() => {
      checkJobStatus(currentJobId);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentJobId, sendingStatus, checkJobStatus]);

  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <div className="i-hugeicons:activity-02 w-5 h-5 mr-2 text-blue-600" />
          Campaign Progress
        </h4>
        <div className="text-sm text-gray-600">
          {emailProgress.emailsPerSecond.toFixed(1)} emails/sec
          {emailProgress.startTime && (
            <span className="ml-2">• Duration: {formatDuration(emailProgress.startTime)}</span>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-900">{emailProgress.sent.toLocaleString()}</div>
          <div className="text-sm text-blue-600">Sent</div>
        </div>
        <div className="bg-green-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-900">{emailProgress.success.toLocaleString()}</div>
          <div className="text-sm text-green-600">Success</div>
        </div>
        <div className="bg-red-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-900">{emailProgress.failed.toLocaleString()}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-900">{emailProgress.pending.toLocaleString()}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{calculateProgress(emailProgress.sent, emailProgress.total).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${calculateProgress(emailProgress.sent, emailProgress.total)}%` }}
          ></div>
        </div>
        {emailProgress.totalBatches > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Batch {emailProgress.currentBatch} of {emailProgress.totalBatches}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="mt-4 bg-white rounded-lg border p-4">
        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
          <div className="i-hugeicons:analytics-01 w-4 h-4 mr-2" />
          Performance Summary
        </h5>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {emailProgress.sent > 0 ? ((emailProgress.success / emailProgress.sent) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {emailProgress.emailsPerSecond.toFixed(1)}
            </div>
            <div className="text-gray-600">Emails/Sec</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {emailProgress.pending > 0 && emailProgress.emailsPerSecond > 0 ? 
                `~${Math.ceil(emailProgress.pending / emailProgress.emailsPerSecond)}s` : 
                '-'
              }
            </div>
            <div className="text-gray-600">ETA</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-bold ${
              sendingStatus === 'sending' ? 'text-green-600' : 
              sendingStatus === 'paused' ? 'text-yellow-600' :
              sendingStatus === 'completed' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {sendingStatus === 'sending' ? 'Active' : 
               sendingStatus === 'paused' ? 'Paused' :
               sendingStatus === 'completed' ? 'Done' :
               'Stopped'}
            </div>
            <div className="text-gray-600">Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};
