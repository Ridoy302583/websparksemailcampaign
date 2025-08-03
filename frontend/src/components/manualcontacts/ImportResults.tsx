// components/ImportResults.js
import React, { useState } from 'react';

const ImportResults = ({ results, onClose, onNewImport }) => {
  const [showDetails, setShowDetails] = useState(true);
  const [activeTab, setActiveTab] = useState('successful');

  if (!results) return null;

  const { successful, failed, totalProcessed, successCount, errorCount } = results;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Import Results</h3>
            <p className="text-sm text-gray-500">Import completed</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-6 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{totalProcessed}</div>
            <div className="text-sm text-gray-500">Total Processed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-500">Successfully Imported</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>

        {/* Success/Error Message */}
        <div className="mt-6 text-center">
          {errorCount === 0 ? (
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              All records imported successfully!
            </div>
          ) : successCount > 0 ? (
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Partial success - {successCount} imported, {errorCount} failed
            </div>
          ) : (
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Import failed - No records were imported
            </div>
          )}
        </div>
      </div>

      {/* Details Toggle */}
      {(successful.length > 0 || failed.length > 0) && (
        <>
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <svg
                className={`w-4 h-4 mr-2 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {/* Detailed Results */}
          {showDetails && (
            <div className="px-6 py-4">
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {successCount > 0 && (
                    <button
                      onClick={() => setActiveTab('successful')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'successful'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Successful ({successCount})
                    </button>
                  )}
                  {errorCount > 0 && (
                    <button
                      onClick={() => setActiveTab('failed')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'failed'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Failed ({errorCount})
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="max-h-64 overflow-y-auto">
                {activeTab === 'successful' && successCount > 0 && (
                  <div className="space-y-2">
                    {successful.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {record.data.firstName} {record.data.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{record.data.email}</div>
                        </div>
                        <div className="text-xs text-green-600">
                          Row {record.row} • ID: {record.id.substring(0, 8)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'failed' && errorCount > 0 && (
                  <div className="space-y-2">
                    {failed.map((record, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {record.data?.firstName || 'Unknown'} {record.data?.lastName || 'User'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.data?.email || 'No email'}
                            </div>
                          </div>
                          <div className="text-xs text-red-600">Row {record.row}</div>
                        </div>
                        <div className="mt-2 text-sm text-red-600">
                          Error: {record.error}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
          <button
            onClick={onNewImport}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Import Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResults;
