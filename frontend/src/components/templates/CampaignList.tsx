// components/CampaignList.tsx (Updated with AdvanceTable integration)
import React, { useEffect, useState } from 'react';
import { emailService, JobStatus } from 'src/services/emailService';
import { emailTrackingService, EmailCampaign } from 'src/services/emailTrackingService';
import { useCampaignStore } from 'src/stores/campaignStore';
import AdvanceTable from 'src/ui/tables/AdvanceTable';
import AdvanceTableHeader from 'src/ui/tables/AdvanceTableHeader';
import AdvanceTablePagination from 'src/ui/tables/AdvanceTablePagination';
import AdvanceTableWrapper from 'src/ui/tables/AdvanceTableWrapper';
import { getStatusColor, getStatusIcon } from 'src/utils/campaignHelpers';

interface CombinedCampaignData {
  id: string;
  campaignName: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  successCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  openRate: number;
  clickRate: number;
  startTime: Date;
  endTime?: Date;
  jobId: string;
  type: 'tracking' | 'job';
  progress?: string;
}

interface TableConfig {
  bordered: boolean;
  striped: boolean;
  responsive: boolean;
  collapsible: boolean;
  size: 'sm' | 'default' | 'lg';
}


export const CampaignList: React.FC = () => {
  const { searchTerm } = useCampaignStore();
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [combinedData, setCombinedData] = useState<CombinedCampaignData[]>([]);
  const [tableConfig, setTableConfig] = useState<TableConfig>({
    bordered: false,
    striped: true,
    responsive: true,
    collapsible: true,
    size: 'default'
  });
  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch jobs and campaigns in parallel
        const [jobsResult, campaignsResult] = await Promise.all([
          emailService.getAllJobs(),
          emailTrackingService.getAllCampaigns()
        ]);

        if (jobsResult.success && jobsResult.jobs) {
          setJobs(jobsResult.jobs);
        }

        setCampaigns(campaignsResult);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Combine jobs and campaigns data
  useEffect(() => {
    const combined: CombinedCampaignData[] = [];

    // Add tracking campaigns
    campaigns.forEach(campaign => {
      const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0;
      const clickRate = campaign.sentCount > 0 ? (campaign.clickedCount / campaign.sentCount) * 100 : 0;

      combined.push({
        id: campaign.id || campaign.jobId,
        campaignName: campaign.campaignName,
        subject: campaign.subject,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        successCount: campaign.successCount,
        failedCount: campaign.failedCount,
        openedCount: campaign.openedCount,
        clickedCount: campaign.clickedCount,
        openRate,
        clickRate,
        startTime: campaign.startTime,
        endTime: campaign.endTime,
        jobId: campaign.jobId,
        type: 'tracking'
      });
    });

    // Add job data (for jobs not yet in campaigns)
    jobs.forEach(job => {
      const existingCampaign = campaigns.find(c => c.jobId === job.id);
      if (!existingCampaign) {
        const progress = job.totalEmails > 0 ? `${job.sent}/${job.totalEmails}` : '0/0';

        combined.push({
          id: job.id,
          campaignName: `Campaign ${job.id.slice(-8)}`,
          subject: 'Email Campaign',
          status: job.status,
          totalRecipients: job.totalEmails,
          sentCount: job.sent,
          successCount: job.success,
          failedCount: job.failed,
          openedCount: 0,
          clickedCount: 0,
          openRate: 0,
          clickRate: 0,
          startTime: new Date(job.startTime),
          jobId: job.id,
          type: 'job',
          progress
        });
      }
    });

    // Sort by start time (newest first)
    combined.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    setCombinedData(combined);
  }, [jobs, campaigns]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'sending':
      case 'running':
        return { text: 'sending', color: 'text-orange-500', bg: 'bg-orange-100' };
      case 'completed':
      case 'sent':
        return { text: 'completed', color: 'text-green-500', bg: 'bg-green-100' };
      case 'paused':
        return { text: 'paused', color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'stopped':
        return { text: 'stopped', color: 'text-red-500', bg: 'bg-red-100' };
      case 'failed':
        return { text: 'failed', color: 'text-red-500', bg: 'bg-red-100' };
      default:
        return { text: status, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  // Define table columns
  const columns = [
    {
      accessor: 'campaignName',
      Header: 'Campaign',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.campaignName}</div>
          <div className="text-sm text-gray-500">{row.original.subject}</div>
          <div className="text-xs text-gray-400">Job ID: {row.original.jobId.slice(-8)}</div>
        </div>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => {
        const statusDisplay = getStatusDisplay(row.original.status);
        return (
          <div className="flex items-center space-x-2">
            <div className={`${getStatusIcon(statusDisplay.text as any)} w-4 h-4 ${statusDisplay.color}`} />
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusDisplay.bg} ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>
        );
      }
    },
    {
      accessor: 'totalRecipients',
      Header: 'Recipients',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => (
        <div className="text-gray-600">
          {row.original.totalRecipients.toLocaleString()}
        </div>
      )
    },
    {
      accessor: 'performance',
      Header: 'Performance',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => {
        const campaign = row.original;

        if (campaign.status === 'completed' || campaign.status === 'sent') {
          return (
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-600">Sent: </span>
                <span className="font-medium">{campaign.sentCount}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Success: </span>
                <span className="font-medium text-green-600">{campaign.successCount}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Failed: </span>
                <span className="font-medium text-red-600">{campaign.failedCount}</span>
              </div>
            </div>
          );
        } else if (campaign.status === 'sending' || campaign.status === 'running' || campaign.status === 'paused') {
          return (
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-600">Progress: </span>
                <span className="font-medium">{campaign.progress || `${campaign.sentCount}/${campaign.totalRecipients}`}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Success: </span>
                <span className="font-medium text-green-600">{campaign.successCount}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Failed: </span>
                <span className="font-medium text-red-600">{campaign.failedCount}</span>
              </div>
            </div>
          );
        } else {
          return <span className="text-gray-400">-</span>;
        }
      }
    },
    {
      accessor: 'startTime',
      Header: 'Date',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => (
        <div className="text-gray-600">
          <div className="text-sm">
            {new Date(row.original.startTime).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(row.original.startTime).toLocaleTimeString()}
          </div>
          {row.original.endTime && (
            <div className="text-xs text-gray-500">
              Ended: {new Date(row.original.endTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )
    },
    {
      accessor: 'actions',
      Header: 'Actions',
      Cell: ({ row }: { row: { original: CombinedCampaignData } }) => {
        const campaign = row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Details"
            >
              <div className="i-hugeicons:eye w-4 h-4" />
            </button>

            {campaign.type === 'tracking' && (
              <button
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="View Analytics"
              >
                <div className="i-hugeicons:analytics-up w-4 h-4" />
              </button>
            )}

            {(campaign.status === 'running' || campaign.status === 'sending') && (
              <button
                className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                title="Pause"
              >
                <div className="i-hugeicons:pause w-4 h-4" />
              </button>
            )}

            {campaign.status === 'paused' && (
              <button
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Resume"
              >
                <div className="i-hugeicons:play w-4 h-4" />
              </button>
            )}

            {(campaign.status === 'running' || campaign.status === 'sending' || campaign.status === 'paused') && (
              <button
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Stop"
              >
                <div className="i-hugeicons:stop w-4 h-4" />
              </button>
            )}

            {(campaign.status === 'completed' || campaign.status === 'sent') && (
              <>
                <button
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Duplicate"
                >
                  <div className="i-hugeicons:copy-01 w-4 h-4" />
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                  title="Export Report"
                >
                  <div className="i-hugeicons:download-01 w-4 h-4" />
                </button>
              </>
            )}

            <button
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="More Options"
            >
              <div className="i-hugeicons:more-horizontal w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ];

  const handleNewCampaign = () => {
    // Handle new campaign creation
    console.log('Create new campaign');
  };

  const handleExport = () => {
    // Handle export functionality
    console.log('Export campaigns');
  };

  return (
    <div className="space-y-4">
      {/* Campaign Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-center mb-2">
            <div className="i-hugeicons:mail-01 w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {combinedData.length}
          </div>
          <div className="text-sm text-gray-600">Total Campaigns</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-center mb-2">
            <div className="i-hugeicons:checkmark-badge-03 w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {combinedData.filter(c => c.status === 'completed' || c.status === 'sent').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-center mb-2">
            <div className="i-hugeicons:loading-03 w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {combinedData.filter(c => c.status === 'sending' || c.status === 'running').length}
          </div>
          <div className="text-sm text-gray-600">Sending</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-center mb-2">
            <div className="i-hugeicons:user-multiple w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {combinedData.reduce((sum, c) => sum + c.totalRecipients, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Recipients</div>
        </div>
      </div>

      {/* AdvanceTable */}
      <AdvanceTableWrapper
        columns={columns}
        data={combinedData}
        sortable={true}
        pagination={true}
        perPage={10}
        className="bg-white rounded-xl border border-gray-200"
      >
        <div className="p-4">
          <AdvanceTableHeader
            title="Email Campaigns"
            isSearch={true}
            isNew={false}
            isExport={true}
            buttonTitle="New Campaign"
            searchPlaceholder="Search campaigns..."
            onNewClick={handleNewCampaign}
            onExportClick={handleExport}
          />
        </div>
        <AdvanceTable
          headerClassName="bg-gray-50"
          rowClassName="hover:bg-gray-50"
          bordered={tableConfig.bordered}
          striped={tableConfig.striped}
          responsive={tableConfig.responsive}
          collapsible={tableConfig.collapsible}
          size={tableConfig.size}
        />
        <div className="p-4">
          <AdvanceTablePagination />
        </div>
      </AdvanceTableWrapper>
    </div>
  );
};
