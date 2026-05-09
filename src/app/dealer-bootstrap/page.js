'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTableCard from '@/components/DataTableCard';
import {
  assignDealerUser,
  createDealerStore,
  getCnmLeadExceptions,
  getDealerAuditLogs,
  getDealerReleaseGates,
  getDealerStores,
  getOpsVerificationRequests,
  updateCnmLeadExceptionStatus,
  updateOpsVerificationStatus,
} from '@/lib/dealerBootstrap';

const btnInteractive =
  'transition-all duration-200 ease-out hover:brightness-110 hover:shadow-md hover:shadow-blue-500/20 cursor-pointer active:scale-[0.98]';
const btnDisabled = 'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-none disabled:active:scale-100';

function DealerBootstrapPageContent() {
  const SECTION_TABS = [
    { id: 'bootstrap', label: 'Bootstrap' },
    { id: 'operations', label: 'Operations' },
    { id: 'audit', label: 'Audit' },
  ];

  const [storeName, setStoreName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [storeReason, setStoreReason] = useState('admin_bootstrap');

  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [mappingRole, setMappingRole] = useState('dealer_admin');
  const [assignReason, setAssignReason] = useState('admin_mapping');

  const [stores, setStores] = useState([]);
  const [logs, setLogs] = useState([]);
  const [cnmExceptions, setCnmExceptions] = useState([]);
  const [opsRequests, setOpsRequests] = useState([]);
  const [releaseGates, setReleaseGates] = useState(null);
  const [adminActionReason, setAdminActionReason] = useState('ops_triage_update');
  const [activeSection, setActiveSection] = useState('bootstrap');
  const [operationsInboxTab, setOperationsInboxTab] = useState('verification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const [storesRes, logsRes, exceptionsRes, opsRes, gatesRes] = await Promise.all([
        getDealerStores(),
        getDealerAuditLogs(),
        getCnmLeadExceptions(),
        getOpsVerificationRequests(),
        getDealerReleaseGates(),
      ]);
      const nextStores = storesRes?.data?.stores || [];
      setStores(nextStores);
      setLogs(logsRes?.data?.logs || []);
      setCnmExceptions(exceptionsRes?.data || []);
      setOpsRequests(opsRes?.data || []);
      setReleaseGates(gatesRes?.data || null);
      if (!selectedStoreId && nextStores.length > 0) {
        setSelectedStoreId(nextStores[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dealer bootstrap data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await createDealerStore({
        name: storeName,
        legalName,
        primaryContactEmail,
        reason: storeReason,
      });
      setStoreName('');
      setLegalName('');
      setPrimaryContactEmail('');
      setSuccess('Dealer store created successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create dealer store');
    } finally {
      setLoading(false);
    }
  };

  const onAssignUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await assignDealerUser({
        storeId: selectedStoreId,
        userEmail,
        role: mappingRole,
        reason: assignReason,
      });
      setUserEmail('');
      setSuccess('Dealer user assigned successfully.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign dealer user');
    } finally {
      setLoading(false);
    }
  };

  const onUpdateExceptionStatus = async (exceptionId, status) => {
    const reason = String(adminActionReason || '').trim();
    if (reason.length < 6) {
      setError('Reason note must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateCnmLeadExceptionStatus({
        exceptionId,
        status,
        reason,
      });
      setSuccess(`CNM exception marked as ${status}.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update CNM exception status');
    } finally {
      setLoading(false);
    }
  };

  const onUpdateOpsStatus = async (requestId, status) => {
    const reason = String(adminActionReason || '').trim();
    if (reason.length < 6) {
      setError('Reason note must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateOpsVerificationStatus({
        requestId,
        status,
        reason,
      });
      setSuccess(`Ops verification request marked as ${status}.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update ops verification request status');
    } finally {
      setLoading(false);
    }
  };

  const opsColumns = [
    { key: 'reason', label: 'Issue', className: 'md:col-span-4', sortable: true },
    {
      key: 'reference',
      label: 'Reference',
      className: 'md:col-span-6',
      render: (item) => (
        <p className="text-xs text-slate-300">
          Store: {item.storeId || 'n/a'} | Ref: {item.sourceRefType || 'n/a'} ({item.sourceRefId || 'n/a'})
        </p>
      ),
      searchValue: (item) => `${item.storeId || ''} ${item.sourceRefType || ''} ${item.sourceRefId || ''}`,
    },
    {
      key: 'status',
      label: 'Status',
      className: 'md:col-span-2',
      sortable: true,
      render: (item) => (
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700/80 text-slate-200">
          {item.status || 'open'}
        </span>
      ),
    },
  ];

  const cnmColumns = [
    { key: 'reason', label: 'Issue', className: 'md:col-span-3', sortable: true },
    {
      key: 'dealerLead',
      label: 'Dealer / Lead',
      className: 'md:col-span-6',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-xs text-slate-300">
            Dealer: {item.dealerNameHint || 'n/a'} | Lead: {item.cnmLeadId || 'n/a'}
          </p>
          <p className="text-xs text-slate-500">
            Store: {item.dealerStoreId || 'n/a'} | Created:{' '}
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'n/a'}
          </p>
        </div>
      ),
      searchValue: (item) =>
        `${item.dealerNameHint || ''} ${item.cnmLeadId || ''} ${item.dealerStoreId || ''} ${item.reason || ''}`,
    },
    {
      key: 'status',
      label: 'Status',
      className: 'md:col-span-1',
      sortable: true,
      render: (item) => (
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700/80 text-slate-200">
          {item.status || 'open'}
        </span>
      ),
    },
  ];

  const auditColumns = [
    {
      key: 'action',
      label: 'Action',
      className: 'md:col-span-2',
      sortable: true,
    },
    {
      key: 'actor',
      label: 'Actor',
      className: 'md:col-span-2',
      render: (item) => <p className="text-xs text-slate-300">{item.actorEmail || 'n/a'}</p>,
      searchValue: (item) => `${item.actorEmail || ''} ${item.actorRole || ''}`,
    },
    {
      key: 'reason',
      label: 'Reason',
      className: 'md:col-span-3',
      sortable: true,
      render: (item) => <p className="text-xs text-slate-300">{item.reason || 'n/a'}</p>,
      searchValue: (item) => `${item.reason || ''}`,
    },
    {
      key: 'object',
      label: 'Object',
      className: 'md:col-span-3',
      render: (item) => (
        <p className="text-xs text-slate-300">
          {item.objectType || 'n/a'} ({item.objectId || 'n/a'})
        </p>
      ),
      searchValue: (item) => `${item.objectType || ''} ${item.objectId || ''}`,
    },
    {
      key: 'createdAt',
      label: 'Created',
      className: 'md:col-span-2',
      sortable: true,
      sortValue: (item) => new Date(item.createdAt || 0).getTime(),
      render: (item) => (
        <p className="text-xs text-slate-400">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'n/a'}
        </p>
      ),
    },
  ];

  const opsOpenCount = opsRequests.filter((item) => item.status === 'open').length;
  const cnmOpenCount = cnmExceptions.filter((item) => item.status === 'open').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
          Dealer Bootstrap
        </h1>
        <p className="text-slate-400 mt-1">Create dealer stores, assign users, and review audit trail.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`px-3 py-1.5 rounded text-sm ${
              activeSection === tab.id
                ? 'bg-blue-600/80 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/80'
            } ${btnInteractive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(success || error) && (
        <div
          className={`p-4 rounded-lg border ${
            success ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-red-500/10 border-red-500/40 text-red-300'
          }`}
        >
          {success || error}
        </div>
      )}

      {activeSection === 'bootstrap' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={onCreateStore} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">Create Store</h2>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="Store name"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Legal name (optional)"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <input
              value={primaryContactEmail}
              onChange={(e) => setPrimaryContactEmail(e.target.value)}
              placeholder="Primary contact email (optional)"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <input
              value={storeReason}
              onChange={(e) => setStoreReason(e.target.value)}
              placeholder="Reason"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg ${btnInteractive} ${btnDisabled}`}
            >
              Create Store
            </button>
          </form>

          <form onSubmit={onAssignUser} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-200">Assign User</h2>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            >
              <option value="">Select store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
            <input
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              type="email"
              required
              placeholder="User email"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <select
              value={mappingRole}
              onChange={(e) => setMappingRole(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            >
              <option value="dealer_admin">dealer_admin</option>
              <option value="manager">manager</option>
              <option value="sales_user">sales_user</option>
              <option value="billing_user">billing_user</option>
              <option value="read_only">read_only</option>
            </select>
            <input
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="Reason"
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
            />
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg ${btnInteractive} ${btnDisabled}`}
            >
              Assign User
            </button>
          </form>
        </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Action Reason (Audit Note)</h2>
        <input
          value={adminActionReason}
          onChange={(e) => setAdminActionReason(e.target.value)}
          placeholder="Write why you are changing queue status (minimum 6 chars)"
          className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-slate-100"
        />
        <p className="text-xs text-slate-400">
          This note is saved in audit logs whenever you click Review, Resolve, or Reopen.
        </p>
        <p className={`text-xs ${String(adminActionReason || '').trim().length >= 6 ? 'text-emerald-300' : 'text-amber-300'}`}>
          {String(adminActionReason || '').trim().length}/6 minimum characters
        </p>
      </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Release Gates</h2>
          <span
            className={`text-[11px] px-2 py-0.5 rounded ${
              releaseGates?.pass ? 'bg-emerald-600/70 text-white' : 'bg-amber-600/70 text-white'
            }`}
          >
            {releaseGates?.pass ? 'pass' : 'needs review'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          {Object.entries(releaseGates?.checks || {}).map(([k, v]) => (
            <p key={k}>
              <span className={v ? 'text-emerald-300' : 'text-rose-300'}>{v ? 'PASS' : 'FAIL'}</span> - {k}
            </p>
          ))}
        </div>
      </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOperationsInboxTab('verification')}
            className={`px-3 py-1.5 rounded text-sm ${
              operationsInboxTab === 'verification'
                ? 'bg-blue-600/80 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/80'
            } ${btnInteractive}`}
          >
            Verification Queue ({opsRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setOperationsInboxTab('cnm')}
            className={`px-3 py-1.5 rounded text-sm ${
              operationsInboxTab === 'cnm'
                ? 'bg-blue-600/80 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/80'
            } ${btnInteractive}`}
          >
            CNM Exceptions ({cnmExceptions.length})
          </button>
        </div>
        <div className="text-xs text-slate-400">
          Open items: Verification {opsOpenCount} | CNM {cnmOpenCount}
        </div>
      </div>
      ) : null}

      {activeSection === 'audit' ? (
      <DataTableCard
        title="Audit Logs"
        rows={logs.slice(0, 200)}
        columns={auditColumns}
        onRefresh={loadData}
        emptyText="No audit logs found."
        searchAccessor={(item) =>
          `${item.action || ''} ${item.actorEmail || ''} ${item.reason || ''} ${item.objectType || ''} ${item.objectId || ''}`
        }
        renderExpanded={(item) => (
          <>
            <p className="text-xs text-slate-300">Role: {item.actorRole || 'n/a'}</p>
            <p className="text-xs text-slate-300 mt-1">Reason: {item.reason || 'n/a'}</p>
            {item.beforeValue ? (
              <pre className="mt-2 text-[11px] text-slate-300 whitespace-pre-wrap break-words">
                {`Before:\n${JSON.stringify(item.beforeValue, null, 2)}`}
              </pre>
            ) : null}
            {item.afterValue ? (
              <pre className="mt-2 text-[11px] text-slate-300 whitespace-pre-wrap break-words">
                {`After:\n${JSON.stringify(item.afterValue, null, 2)}`}
              </pre>
            ) : null}
          </>
        )}
      />
      ) : null}

      {activeSection === 'operations' && operationsInboxTab === 'verification' ? (
      <DataTableCard
        title="Ops Verification Requests"
        rows={opsRequests.slice(0, 100)}
        columns={opsColumns}
        onRefresh={loadData}
        emptyText="No ops verification requests found."
        rowActions={(item) => (
          <>
            <button
              type="button"
              disabled={loading || item.status === 'in_review'}
              onClick={() => onUpdateOpsStatus(item._id, 'in_review')}
              className={`px-2 py-1 text-xs rounded bg-amber-600/80 text-white ${
                item.status === 'in_review' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Review
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'resolved'}
              onClick={() => onUpdateOpsStatus(item._id, 'resolved')}
              className={`px-2 py-1 text-xs rounded bg-emerald-600/80 text-white ${
                item.status === 'resolved' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'open'}
              onClick={() => onUpdateOpsStatus(item._id, 'open')}
              className={`px-2 py-1 text-xs rounded bg-slate-600/80 text-white ${
                item.status === 'open' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Reopen
            </button>
          </>
        )}
      />
      ) : null}

      {activeSection === 'operations' && operationsInboxTab === 'cnm' ? (
      <DataTableCard
        title="CNM Lead Exceptions"
        rows={cnmExceptions.slice(0, 100)}
        columns={cnmColumns}
        onRefresh={loadData}
        emptyText="No CNM lead exceptions found."
        rowActions={(item) => (
          <>
            <button
              type="button"
              disabled={loading || item.status === 'in_review'}
              onClick={() => onUpdateExceptionStatus(item._id, 'in_review')}
              className={`px-2 py-1 text-xs rounded bg-amber-600/80 text-white ${
                item.status === 'in_review' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Review
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'resolved'}
              onClick={() => onUpdateExceptionStatus(item._id, 'resolved')}
              className={`px-2 py-1 text-xs rounded bg-emerald-600/80 text-white ${
                item.status === 'resolved' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'open'}
              onClick={() => onUpdateExceptionStatus(item._id, 'open')}
              className={`px-2 py-1 text-xs rounded bg-slate-600/80 text-white ${
                item.status === 'open' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnInteractive} ${btnDisabled}`}
            >
              Reopen
            </button>
          </>
        )}
        renderExpanded={(item) => (
          <>
            {item.details?.message ? (
              <p className="text-xs text-amber-300/90">Detail: {item.details.message}</p>
            ) : null}
            <p className="text-xs text-slate-300 mt-1">
              CNM Lead ID: <span className="text-slate-100">{item.cnmLeadId || 'n/a'}</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Exception ID: <span className="text-slate-100">{item._id}</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Dealer Store ID: <span className="text-slate-100">{item.dealerStoreId || 'n/a'}</span>
            </p>
            <pre className="mt-2 text-[11px] text-slate-300 whitespace-pre-wrap break-words">
              {JSON.stringify(item.details || {}, null, 2)}
            </pre>
          </>
        )}
      />
      ) : null}
    </div>
  );
}

export default function DealerBootstrapPage() {
  return (
    <DashboardLayout>
      <DealerBootstrapPageContent />
    </DashboardLayout>
  );
}
