// IMMEDIATE FIX: Add this to your ContactsList component

import React, { useEffect, useMemo, useState } from 'react';
import { useContacts } from 'src/hooks/useContacts';
import { useCampaignStore } from 'src/stores/campaignStore';
import { useDebounce } from 'src/hooks/useDebounce';
import { ProfileImage } from 'src/components/shared/ProfileImage';
import { useFetchAllUsers } from 'src/hooks/useFetchAllUsers';

export const ContactsList: React.FC = () => {
  const store = useCampaignStore();
  const [activeTab, setActiveTab] = useState<'campaign' | 'manual'>('campaign');
  const [manualSearchTerm, setManualSearchTerm] = useState('');

  // Safely destructure with defaults
  const {
    allContacts = [],
    contactSearchTerm = '',
    setContactSearchTerm,
    loadingContacts = false,
    contactsError = null,
    selectedContacts = [],
    setSelectedContacts,
    filters = {}, // Add this
    setFilters // Add this
  } = store;

  const {
    filteredContacts = [],
    fetchContacts,
    handleSelectContact,
    handleSelectAllContacts,
    clearContactsCache,
    isCacheValid,
    getSelectedContactsData
  } = useContacts();

  // Fetch manual Firebase contacts
  const { users: manualContacts, isLoading: manualContactsLoading } = useFetchAllUsers();

  useEffect(() => {
    const needsReset = Object.entries(filters).some(([key, value]) => value && value !== 'all');
    
    if (needsReset) {
      setFilters({
        emailVerified: 'all',
        registerType: 'all',
        status: 'all',
        planName: 'all',
        lastLogin: 'all'
      });
    }
  }, []); // Run only on mount

  // Debounce search terms to prevent freezing during typing
  const debouncedSearchTerm = useDebounce(contactSearchTerm, 300);
  const debouncedManualSearchTerm = useDebounce(manualSearchTerm, 300);

  // Get current contacts and search term based on active tab
  const currentContacts = activeTab === 'campaign' ? 
    (filteredContacts.length > 0 ? filteredContacts : allContacts) : 
    manualContacts;
  
  const currentSearchTerm = activeTab === 'campaign' ? debouncedSearchTerm : debouncedManualSearchTerm;
  const currentLoading = activeTab === 'campaign' ? loadingContacts : manualContactsLoading;

  // Optimized contact filtering with debounced search to prevent freezing
  const displayContacts = useMemo(() => {
    const searchTerm = (currentSearchTerm || '').toLowerCase().trim();
    
    // If no search term, return all contacts (up to 500 for performance)
    if (!searchTerm) {
      return currentContacts.slice(0, 500);
    }
    
    // Optimized search with early termination
    const results = [];
    
    for (let i = 0; i < currentContacts.length && results.length < 100; i++) {
      const contact = currentContacts[i];
      const email = (contact.email || '').toLowerCase();
      const name = (contact.fullName || contact.name || '').toLowerCase();
      
      if (email.includes(searchTerm) || name.includes(searchTerm)) {
        results.push(contact);
      }
    }
    
    return results;
  }, [currentContacts, currentSearchTerm]);

  // Load contacts on mount if not cached
  useEffect(() => {
    if (allContacts.length === 0 && !loadingContacts) {
      fetchContacts();
    }
  }, [allContacts.length, loadingContacts, fetchContacts]);

  const handleRefreshContacts = () => {
    clearContactsCache();
    fetchContacts(true);
  };

  // Custom select all handler for current tab only - uses FULL dataset not just displayed
  const handleSelectAllCurrentTab = () => {
    if (!setSelectedContacts) return;

    // Use full dataset for the current tab, not just displayed contacts
    const fullCurrentTabContacts = activeTab === 'campaign' ? 
      (filteredContacts.length > 0 ? filteredContacts : allContacts) : 
      manualContacts;
    
    const currentTabContactIds = fullCurrentTabContacts.map(contact => contact.id);
    const currentTabSelectedIds = selectedContacts.filter(id => 
      currentTabContactIds.includes(id)
    );

    if (currentTabSelectedIds.length === fullCurrentTabContacts.length && fullCurrentTabContacts.length > 0) {
      // Deselect all contacts from current tab
      const remainingSelected = selectedContacts.filter(id => 
        !currentTabContactIds.includes(id)
      );
      setSelectedContacts(remainingSelected);
    } else {
      // Select all contacts from current tab (FULL dataset)
      const otherTabSelected = selectedContacts.filter(id => 
        !currentTabContactIds.includes(id)
      );
      setSelectedContacts([...otherTabSelected, ...currentTabContactIds]);
    }
  };

  // Check if all current tab contacts are selected - uses FULL dataset
  const isCurrentTabAllSelected = () => {
    const fullCurrentTabContacts = activeTab === 'campaign' ? 
      (filteredContacts.length > 0 ? filteredContacts : allContacts) : 
      manualContacts;
    
    if (fullCurrentTabContacts.length === 0) return false;
    const currentTabContactIds = fullCurrentTabContacts.map(contact => contact.id);
    return currentTabContactIds.every(id => selectedContacts.includes(id));
  };

  // Get count of selected contacts from current tab
  const getCurrentTabSelectedCount = () => {
    const fullCurrentTabContacts = activeTab === 'campaign' ? 
      (filteredContacts.length > 0 ? filteredContacts : allContacts) : 
      manualContacts;
    
    const currentTabContactIds = fullCurrentTabContacts.map(contact => contact.id);
    return selectedContacts.filter(id => currentTabContactIds.includes(id)).length;
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return 'Never';

    const date = new Date(lastLogin);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="mb-6">
      {/* Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('campaign')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'campaign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Campaign Contacts ({allContacts.length})
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manual Firebase Contacts ({manualContacts.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 flex items-center">
          <div className="i-hugeicons:user-group w-4 h-4 mr-2" />
          Select Recipients ({currentContacts.length} total, {displayContacts.length} showing)
          {activeTab === 'campaign' && isCacheValid() && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Cached
            </span>
          )}
        </h4>
        <div className="flex items-center space-x-2">
          {activeTab === 'campaign' && (
            <>
              <button
                onClick={handleRefreshContacts}
                disabled={loadingContacts}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Force refresh contacts"
              >
                <div className={`i-hugeicons:loading-03 w-4 h-4 mr-1 ${loadingContacts ? 'animate-spin' : ''}`} />
                {loadingContacts ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={clearContactsCache}
                className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear contacts cache"
              >
                <div className="i-hugeicons:delete-02 w-4 h-4 mr-1" />
                Clear Cache
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading State - First Time */}
      {currentLoading && currentContacts.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="i-hugeicons:loading-03 w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">
            Loading {activeTab === 'campaign' ? 'campaign' : 'manual Firebase'} contacts for the first time...
          </span>
        </div>
      )}

      {/* Loading State - Refreshing */}
      {currentLoading && currentContacts.length > 0 && (
        <div className="flex items-center justify-center py-4 bg-blue-50 rounded-lg mb-4">
          <div className="i-hugeicons:loading-03 w-4 h-4 animate-spin text-blue-600 mr-2" />
          <span className="text-blue-700 text-sm">
            Refreshing {activeTab === 'campaign' ? 'campaign' : 'manual Firebase'} contacts...
          </span>
        </div>
      )}

      {/* Main Content */}
      {!currentLoading && !contactsError && (
        <>
          {/* Contact Search - Optimized to prevent freezing */}
          <div className="relative mb-4">
            <div className="i-hugeicons:search-01 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'campaign' ? 'campaign' : 'manual Firebase'} contacts by name or email...`}
              value={activeTab === 'campaign' ? contactSearchTerm : manualSearchTerm}
              onChange={(e) => {
                if (activeTab === 'campaign') {
                  setContactSearchTerm && setContactSearchTerm(e.target.value);
                } else {
                  setManualSearchTerm(e.target.value);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contacts List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {/* Select All Header */}
            <div className="p-3 bg-gray-50 border-b sticky top-0 z-10">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isCurrentTabAllSelected()}
                  onChange={handleSelectAllCurrentTab}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({currentContacts.length} {activeTab === 'campaign' ? 'campaign' : 'manual'} contacts)
                  {displayContacts.length < currentContacts.length && (
                    <span className="text-xs text-gray-500 ml-1">
                      (showing {displayContacts.length})
                    </span>
                  )}
                </span>
                {selectedContacts.length > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {getCurrentTabSelectedCount()}/{currentContacts.length} selected
                  </span>
                )}
              </label>
            </div>

            {/* Empty State */}
            {displayContacts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="i-hugeicons:user w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">No contacts match your criteria</p>
                <p className="text-sm text-gray-400 mb-4">
                  {currentContacts.length === 0
                    ? `No ${activeTab === 'campaign' ? 'campaign' : 'manual Firebase'} contacts have been loaded yet`
                    : `Try adjusting your search criteria`
                  }
                </p>

                {activeTab === 'campaign' && allContacts.length === 0 && (
                  <button
                    onClick={() => fetchContacts(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Load Contacts Now
                  </button>
                )}
              </div>
            ) : (
              /* Contacts Grid - REPLACE filteredContacts with displayContacts */
              <div className="divide-y divide-gray-200">
                {displayContacts.map((contact, index) => (
                  <label
                    key={`${contact.id}-${index}`}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />

                    {/* Contact Info */}
                    <div className="flex items-center flex-1">
                      {/* Profile Picture - Fixed for Google images */}
                      <div className="relative mr-3">
                        <ProfileImage
                          src={contact.profilePic}
                          alt={contact.fullName || contact.email}
                          size="md"
                          fallbackText={contact.fullName || contact.email}
                        />
                      </div>

                      {/* Name and Email */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">
                          {contact.fullName || contact.name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activeTab === 'campaign' ? (
                            <>
                              Last login: {formatLastLogin(contact.lastLogin)} •
                              Member since {new Date(contact.createdAt).toLocaleDateString()}
                            </>
                          ) : (
                            <>
                              Role: {contact.role || 'N/A'} •
                              Created: {contact.createdAt?.seconds ? 
                                new Date(contact.createdAt.seconds * 1000).toLocaleDateString() : 
                                'N/A'}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badges and Status */}
                    <div className="flex items-center space-x-2 ml-4">
                      {activeTab === 'campaign' ? (
                        <>
                          {/* Register Type Badge */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contact.registerType === 'github' ? 'bg-gray-100 text-gray-800' :
                              contact.registerType === 'google' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                            {contact.registerType}
                          </span>

                          {/* Role Badge */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contact.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {contact.role}
                          </span>

                          {/* Email Verification Status */}
                          {contact.emailVerified ? (
                            <div className="flex items-center">
                              <div className="i-hugeicons:tick-02 w-4 h-4 text-green-500" title="Email Verified" />
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="i-hugeicons:cancel-circle w-4 h-4 text-red-500" title="Email Not Verified" />
                            </div>
                          )}

                          {/* Account Status */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contact.status === 'active' ? 'bg-green-100 text-green-800' :
                              contact.status === 'inactive' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                            {contact.status}
                          </span>
                        </>
                      ) : (
                        <>
                          {/* Role Badge for Manual Contacts */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contact.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {contact.role || 'User'}
                          </span>

                          {/* Gender Badge */}
                          {contact.gender && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contact.gender === 'male' ? 'bg-green-100 text-green-800' :
                                'bg-pink-100 text-pink-800'
                              }`}>
                              {contact.gender === 'male' ? 'Male' : 'Female'}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedContacts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {selectedContacts.length} recipients selected for campaign
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {(() => {
                      const currentTabSelected = getCurrentTabSelectedCount();
                      const otherTabSelected = selectedContacts.length - currentTabSelected;
                      
                      return `${currentTabSelected} from ${activeTab === 'campaign' ? 'campaign' : 'manual'} contacts${otherTabSelected > 0 ? `, ${otherTabSelected} from other tab` : ''}`;
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContacts && setSelectedContacts([])}
                  className="text-xs text-blue-700 hover:text-blue-900 underline"
                >
                  Clear All
                </button>
              </div>

              {/* Preview Selected Contacts */}
              <div className="mt-3 max-h-20 overflow-y-auto">
                <div className="text-xs text-blue-800">
                  <strong>Selected:</strong> {getSelectedContactsData().map(c => c.email).join(', ')}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
