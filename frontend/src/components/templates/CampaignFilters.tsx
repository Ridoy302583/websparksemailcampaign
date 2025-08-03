import React from 'react';
import { useServerConnection } from 'src/hooks/useServerConnection';
import { useCampaignStore } from 'src/stores/campaignStore';

export const CampaignFilters: React.FC = () => {
  const { filters, setFilters } = useCampaignStore();
  const { isConnected, serverHealth, isChecking, checkConnection } = useServerConnection();

  const handlePlanFilterChange = (planName: string) => {
    setFilters({ planName });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Filter Recipients</h3>
      
      {/* Server Connection Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Server Status</span>
          <button
            onClick={checkConnection}
            disabled={isChecking}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isChecking ? 'Checking...' : 'Refresh'}
          </button>
        </div>
        
        <div className={`flex items-center px-3 py-2 rounded-lg text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          {isConnected ? 'Connected to Email Server' : 'Server Disconnected'}
        </div>
        
        {serverHealth && (
          <div className="mt-2 text-xs text-gray-600">
            <div>Active Jobs: {serverHealth.activeJobs || 0}</div>
            <div>Rate Limit: {serverHealth.config?.rateLimit}</div>
            <div>Batch Size: {serverHealth.config?.batchSize}</div>
          </div>
        )}
      </div>
      
      {/* Plan Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan Type
        </label>
        <div className="space-y-2">
          {['all', 'Free', 'Starter', 'Plus', 'Pro'].map((plan) => (
            <label key={plan} className="flex items-center">
              <input
                type="radio"
                name="planType"
                value={plan}
                checked={filters.planName === plan}
                onChange={(e) => handlePlanFilterChange(e.target.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">
                {plan === 'all' ? 'All Plans' : plan}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Email Verification Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Status
        </label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'verified', label: 'Verified' },
            { value: 'not_verified', label: 'Not Verified' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="emailStatus"
                value={option.value}
                checked={filters.emailVerified === option.value}
                onChange={(e) => setFilters({ emailVerified: e.target.value })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Register Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Register Type
        </label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Types' },
            { value: 'github', label: 'GitHub' },
            { value: 'google', label: 'Google' },
            { value: 'general', label: 'General' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="registerType"
                value={option.value}
                checked={filters.registerType === option.value}
                onChange={(e) => setFilters({ registerType: e.target.value })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Account Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Status
        </label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="accountStatus"
                value={option.value}
                checked={filters.status === option.value}
                onChange={(e) => setFilters({ status: e.target.value })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Last Login Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Login
        </label>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All Time' },
            { value: '7_days', label: 'Last 7 Days' },
            { value: '30_days', label: 'Last 30 Days' },
            { value: 'this_month', label: 'This Month' },
            { value: 'last_month', label: 'Last Month' },
            { value: 'never', label: 'Never Logged In' }
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="lastLogin"
                value={option.value}
                checked={filters.lastLogin === option.value}
                onChange={(e) => setFilters({ lastLogin: e.target.value })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setFilters({
            emailVerified: 'all',
            registerType: 'all',
            accountType: 'all',
            lastLogin: 'all',
            status: 'all',
            planName: 'all'
          })}
          className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};
