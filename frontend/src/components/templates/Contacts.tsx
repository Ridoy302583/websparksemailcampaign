import React, { useState, useEffect } from 'react';
import { ProfileImage } from 'src/components/shared/ProfileImage';

interface ApiContact {
  id: number;
  full_name: string;
  profile_pic?: string;
  email: string;
  role: string;
  register_type: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  last_login?: string;
  refer_code: string;
  context_optimization: boolean;
  theme: string;
  language: string;
}

interface Contact {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  profilePic?: string;
  role: string;
  registerType: string;
  emailVerified: boolean;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
  referCode: string;
  contextOptimization: boolean;
  theme: string;
  language: string;
  tags: string[];
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalContacts, setTotalContacts] = useState(0);
  const [perPage] = useState(20);

  const API_BASE_URL = 'https://api.websparks.ai';

  // Transform API data to component format
  const transformApiContact = (apiContact: ApiContact): Contact => {
    const nameParts = apiContact.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      id: apiContact.id,
      email: apiContact.email,
      firstName,
      lastName,
      fullName: apiContact.full_name,
      profilePic: apiContact.profile_pic,
      role: apiContact.role,
      registerType: apiContact.register_type,
      emailVerified: apiContact.email_verified,
      status: apiContact.status as 'active' | 'inactive' | 'pending',
      createdAt: apiContact.created_at,
      lastLogin: apiContact.last_login,
      referCode: apiContact.refer_code,
      contextOptimization: apiContact.context_optimization,
      theme: apiContact.theme,
      language: apiContact.language,
      tags: [apiContact.role, apiContact.register_type].filter(Boolean)
    };
  };

  // Get access token from localStorage
  const getAccessToken = () => {
    return localStorage.getItem('access_token');
  };

  // Fetch contacts from API
  const fetchContacts = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token found. Please log in again.');
      }
      
      const response = await fetch(
        `${API_BASE_URL}/users-all/?page=${page}&per_page=${perPage}&sort_by=id&sort_order=asc`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different possible API response formats
      let users = [];
      let total = 0;
      let hasMore = false;
      
      if (Array.isArray(data)) {
        // If API returns array directly
        users = data;
        total = data.length;
        // Check if we got full page, indicating there might be more
        hasMore = data.length === perPage;
      } else if (data.users || data.data) {
        // If API returns object with users/data array and pagination info
        users = data.users || data.data;
        total = data.total || data.total_count || 0;
        const totalPages = data.total_pages || Math.ceil(total / perPage);
        hasMore = page < totalPages;
      } else {
        // Fallback
        users = [];
        total = 0;
        hasMore = false;
      }
      
      const transformedContacts = users.map(transformApiContact);
      
      if (append && page > 1) {
        // Append new contacts to existing ones
        setContacts(prev => [...prev, ...transformedContacts]);
      } else {
        // Replace contacts (first load or refresh)
        setContacts(transformedContacts);
        setCurrentPage(page);
      }
      
      setTotalContacts(total);
      setHasNextPage(hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load contacts on component mount
  useEffect(() => {
    fetchContacts(1, false);
  }, []);

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContacts(nextPage, true);
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Contact['status']) => {
    switch (status) {
      case 'active':
        return <div className="i-hugeicons:tick-02 w-4 h-4 text-green-600" />;
      case 'inactive':
        return <div className="i-hugeicons:cancel-circle w-4 h-4 text-red-600" />;
      case 'pending':
        return <div className="i-hugeicons:alert-triangle w-4 h-4 text-yellow-600" />;
      default:
        return <div className="i-hugeicons:alert-triangle w-4 h-4 text-gray-600" />;
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailTemplate || selectedContacts.length === 0) return;

    setSendingEmail(true);
    
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    
    try {
      // Simulate email sending - replace with actual email service integration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Email sent successfully to ${selectedContactsData.length} contacts!`);
      setShowSendEmailModal(false);
      setSelectedContacts([]);
      setEmailSubject('');
      setEmailTemplate('');
    } catch (error) {
      alert('Failed to send emails. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  // Calculate stats
  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.status === 'active').length,
    inactive: contacts.filter(c => c.status === 'inactive').length,
    pending: contacts.filter(c => c.status === 'pending').length,
    verified: contacts.filter(c => c.emailVerified).length
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="i-hugeicons:loading-03 w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading contacts...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="i-hugeicons:cancel-circle w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load contacts</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => fetchContacts(currentPage)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-2">Manage your subscriber lists and contact information</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                setCurrentPage(1);
                fetchContacts(1, false);
              }}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <div className={`i-hugeicons:loading-03 w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="i-hugeicons:upload-04 w-4 h-4 mr-2" />
              Import
            </button>
            <button className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="i-hugeicons:download-01 w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <div className="i-hugeicons:add-01 w-4 h-4 mr-2" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="i-hugeicons:user-group w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600 text-sm">Total Contacts</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="i-hugeicons:tick-02 w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-gray-600 text-sm">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="i-hugeicons:cancel-circle w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-gray-600 text-sm">Inactive</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="i-hugeicons:alert-triangle w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-gray-600 text-sm">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="i-hugeicons:mail-01 w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
                <p className="text-gray-600 text-sm">Email Verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="i-hugeicons:search-01 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="i-hugeicons:filter w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
          {selectedContacts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedContacts.length} selected</span>
              <button 
                onClick={() => setShowSendEmailModal(true)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Send Email
              </button>
              <button className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">
                Delete Selected
              </button>
            </div>
          )}
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Register Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ProfileImage
                          src={contact.profilePic}
                          alt={contact.fullName}
                          size="sm"
                          fallbackText={contact.fullName}
                          className="mr-3"
                        />
                            }}
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {contact.fullName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {contact.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {contact.registerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {contact.emailVerified ? (
                          <div className="i-hugeicons:tick-02 w-4 h-4 text-green-500 mr-1" />
                        ) : (
                          <div className="i-hugeicons:cancel-circle w-4 h-4 text-red-500 mr-1" />
                        )}
                        <span className="text-sm text-gray-900">
                          {contact.emailVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(contact.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {contact.lastLogin 
                        ? new Date(contact.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                          <div className="i-hugeicons:edit-02 w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                          <div className="i-hugeicons:delete-02 w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <div className="i-hugeicons:more-horizontal w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <div className="i-hugeicons:loading-03 w-4 h-4 mr-2 animate-spin" />
                  Loading more contacts...
                </>
              ) : (
                <>
                  <div className="i-hugeicons:add-01 w-4 h-4 mr-2" />
                  Load More Contacts
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Info */}
        {contacts.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Showing {contacts.length} of {totalContacts > 0 ? totalContacts : contacts.length} contacts
              {hasNextPage && (
                <span className="ml-2 text-blue-600">• More available</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Email to {selectedContacts.length} Contact{selectedContacts.length > 1 ? 's' : ''}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email message..."
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recipients:</strong> {contacts.filter(c => selectedContacts.includes(c.id)).map(c => c.email).join(', ')}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSendEmailModal(false);
                  setEmailSubject('');
                  setEmailTemplate('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailSubject || !emailTemplate || sendingEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
