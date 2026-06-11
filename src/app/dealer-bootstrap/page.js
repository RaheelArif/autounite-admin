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
  getDealerSecurityChecklist,
  getDealerStores,
  getOpsVerificationRequests,
  updateCnmLeadExceptionStatus,
  updateOpsVerificationStatus,
} from '@/lib/dealerBootstrap';

const btnDisabled = 'disabled:opacity-60 disabled:cursor-not-allowed';

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
  const [securityChecklist, setSecurityChecklist] = useState(null);
  const [adminActionReason, setAdminActionReason] = useState('ops_triage_update');
  const [activeSection, setActiveSection] = useState('bootstrap');
  const [operationsInboxTab, setOperationsInboxTab] = useState('verification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const [storesRes, logsRes, exceptionsRes, opsRes, gatesRes, securityRes] = await Promise.all([
        getDealerStores(),
        getDealerAuditLogs(),
        getCnmLeadExceptions(),
        getOpsVerificationRequests(),
        getDealerReleaseGates(),
        getDealerSecurityChecklist(),
      ]);
      const nextStores = storesRes?.data?.stores || [];
      setStores(nextStores);
      setLogs(logsRes?.data?.logs || []);
      setCnmExceptions(exceptionsRes?.data || []);
      setOpsRequests(opsRes?.data || []);
      setReleaseGates(gatesRes?.data || null);
      setSecurityChecklist(securityRes?.data || null);
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
        <p className="text-xs au-dash-text-muted">
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
        <span className="au-dash-badge">
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
          <p className="text-xs au-dash-text-muted">
            Dealer: {item.dealerNameHint || 'n/a'} | Lead: {item.cnmLeadId || 'n/a'}
          </p>
          <p className="text-xs au-dash-text-subtle">
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
        <span className="au-dash-badge">
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
      render: (item) => <p className="text-xs au-dash-text-muted">{item.actorEmail || 'n/a'}</p>,
      searchValue: (item) => `${item.actorEmail || ''} ${item.actorRole || ''}`,
    },
    {
      key: 'reason',
      label: 'Reason',
      className: 'md:col-span-3',
      sortable: true,
      render: (item) => <p className="text-xs au-dash-text-muted">{item.reason || 'n/a'}</p>,
      searchValue: (item) => `${item.reason || ''}`,
    },
    {
      key: 'object',
      label: 'Object',
      className: 'md:col-span-3',
      render: (item) => (
        <p className="text-xs au-dash-text-muted">
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
        <p className="text-xs au-dash-text-subtle">
          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'n/a'}
        </p>
      ),
    },
  ];

  const opsOpenCount = opsRequests.filter((item) => item.status === 'open').length;
  const cnmOpenCount = cnmExceptions.filter((item) => item.status === 'open').length;

  return (
    <div className="au-dash-page">
      <div className="au-dash-card au-dash-tab-bar">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={`au-dash-tab ${activeSection === tab.id ? 'au-dash-tab--active' : ''}`}
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
          <form onSubmit={onCreateStore} className="au-dash-card p-6 space-y-3">
            <h2 className="au-dash-card-title">Create Store</h2>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              placeholder="Store name"
              className="au-dash-input"
            />
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Legal name (optional)"
              className="au-dash-input"
            />
            <input
              value={primaryContactEmail}
              onChange={(e) => setPrimaryContactEmail(e.target.value)}
              placeholder="Primary contact email (optional)"
              className="au-dash-input"
            />
            <input
              value={storeReason}
              onChange={(e) => setStoreReason(e.target.value)}
              placeholder="Reason"
              className="au-dash-input"
            />
            <button
              type="submit"
              disabled={loading}
              className={`au-dash-btn ${btnDisabled}`}
            >
              Create Store
            </button>
          </form>

          <form onSubmit={onAssignUser} className="au-dash-card p-6 space-y-3">
            <h2 className="au-dash-card-title">Assign User</h2>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              required
              className="au-dash-input"
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
              className="au-dash-input"
            />
            <select
              value={mappingRole}
              onChange={(e) => setMappingRole(e.target.value)}
              className="au-dash-input"
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
              className="au-dash-input"
            />
            <button
              type="submit"
              disabled={loading}
              className={`au-dash-btn ${btnDisabled}`}
            >
              Assign User
            </button>
          </form>
        </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="au-dash-card p-6 space-y-3">
        <h2 className="au-dash-card-title">Action Reason (Audit Note)</h2>
        <input
          value={adminActionReason}
          onChange={(e) => setAdminActionReason(e.target.value)}
          placeholder="Write why you are changing queue status (minimum 6 chars)"
          className="au-dash-input"
        />
        <p className="text-xs au-dash-text-subtle">
          This note is saved in audit logs whenever you click Review, Resolve, or Reopen.
        </p>
        <p className={`text-xs ${String(adminActionReason || '').trim().length >= 6 ? 'text-emerald-300' : 'text-amber-300'}`}>
          {String(adminActionReason || '').trim().length}/6 minimum characters
        </p>
      </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="au-dash-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="au-dash-card-title au-dash-card-title--sm">Release Gates</h2>
          <span
            className={`text-[11px] px-2 py-0.5 rounded ${
              releaseGates?.pass ? 'bg-emerald-600/70 text-white' : 'bg-amber-600/70 text-white'
            }`}
          >
            {releaseGates?.pass ? 'pass' : 'needs review'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs au-dash-text-muted">
          {Object.entries(releaseGates?.checks || {}).map(([k, v]) => (
            <p key={k}>
              <span className={v ? 'text-emerald-300' : 'text-rose-300'}>{v ? 'PASS' : 'FAIL'}</span> - {k}
            </p>
          ))}
        </div>
      </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="au-dash-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="au-dash-card-title au-dash-card-title--sm">Security Checklist</h2>
          <span
            className={`text-[11px] px-2 py-0.5 rounded ${
              securityChecklist?.pass ? 'bg-emerald-600/70 text-white' : 'bg-amber-600/70 text-white'
            }`}
          >
            {securityChecklist?.pass ? 'pass' : 'needs review'}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs au-dash-text-muted">
          {Object.entries(securityChecklist?.checks || {}).map(([k, v]) => (
            <p key={k}>
              <span className={v ? 'text-emerald-300' : 'text-rose-300'}>{v ? 'PASS' : 'FAIL'}</span> - {k}
            </p>
          ))}
        </div>
        {securityChecklist?.metrics ? (
          <p className="text-xs au-dash-text-subtle mt-2">
            Reason coverage: {securityChecklist.metrics.reasonCoveragePct ?? 'n/a'}% | Sampled logs:{' '}
            {securityChecklist.metrics.sampledAdminMutationLogs ?? 0}
          </p>
        ) : null}
      </div>
      ) : null}

      {activeSection === 'operations' ? (
      <div className="au-dash-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOperationsInboxTab('verification')}
            className={`au-dash-tab ${operationsInboxTab === 'verification' ? 'au-dash-tab--active' : ''}`}
          >
            Verification Queue ({opsRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setOperationsInboxTab('cnm')}
            className={`au-dash-tab ${operationsInboxTab === 'cnm' ? 'au-dash-tab--active' : ''}`}
          >
            CNM Exceptions ({cnmExceptions.length})
          </button>
        </div>
        <div className="text-xs au-dash-text-subtle">
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
            <p className="text-xs au-dash-text-muted">Role: {item.actorRole || 'n/a'}</p>
            <p className="text-xs au-dash-text-muted mt-1">Reason: {item.reason || 'n/a'}</p>
            {item.beforeValue ? (
              <pre className="mt-2 text-[11px] au-dash-text-muted whitespace-pre-wrap break-words">
                {`Before:\n${JSON.stringify(item.beforeValue, null, 2)}`}
              </pre>
            ) : null}
            {item.afterValue ? (
              <pre className="mt-2 text-[11px] au-dash-text-muted whitespace-pre-wrap break-words">
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
              } ${btnDisabled}`}
            >
              Review
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'resolved'}
              onClick={() => onUpdateOpsStatus(item._id, 'resolved')}
              className={`px-2 py-1 text-xs rounded bg-emerald-600/80 text-white ${
                item.status === 'resolved' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnDisabled}`}
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'open'}
              onClick={() => onUpdateOpsStatus(item._id, 'open')}
              className={`au-dash-btn au-dash-btn--sm ${
                item.status === 'open' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnDisabled}`}
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
              } ${btnDisabled}`}
            >
              Review
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'resolved'}
              onClick={() => onUpdateExceptionStatus(item._id, 'resolved')}
              className={`px-2 py-1 text-xs rounded bg-emerald-600/80 text-white ${
                item.status === 'resolved' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnDisabled}`}
            >
              Resolve
            </button>
            <button
              type="button"
              disabled={loading || item.status === 'open'}
              onClick={() => onUpdateExceptionStatus(item._id, 'open')}
              className={`au-dash-btn au-dash-btn--sm ${
                item.status === 'open' ? 'opacity-60 cursor-not-allowed' : ''
              } ${btnDisabled}`}
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
            <p className="text-xs au-dash-text-muted mt-1">
              CNM Lead ID: <span className="au-dash-text-strong">{item.cnmLeadId || 'n/a'}</span>
            </p>
            <p className="text-xs au-dash-text-muted mt-1">
              Exception ID: <span className="au-dash-text-strong">{item._id}</span>
            </p>
            <p className="text-xs au-dash-text-muted mt-1">
              Dealer Store ID: <span className="au-dash-text-strong">{item.dealerStoreId || 'n/a'}</span>
            </p>
            <pre className="mt-2 text-[11px] au-dash-text-muted whitespace-pre-wrap break-words">
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
