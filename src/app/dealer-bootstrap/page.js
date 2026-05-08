'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  assignDealerUser,
  createDealerStore,
  getCnmLeadExceptions,
  getDealerAuditLogs,
  getDealerStores,
} from '@/lib/dealerBootstrap';

function DealerBootstrapPageContent() {
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
  const [expandedExceptionId, setExpandedExceptionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const [storesRes, logsRes, exceptionsRes] = await Promise.all([
        getDealerStores(),
        getDealerAuditLogs(),
        getCnmLeadExceptions(),
      ]);
      const nextStores = storesRes?.data?.stores || [];
      setStores(nextStores);
      setLogs(logsRes?.data?.logs || []);
      setCnmExceptions(exceptionsRes?.data || []);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
          Dealer Bootstrap
        </h1>
        <p className="text-slate-400 mt-1">Create dealer stores, assign users, and review audit trail.</p>
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
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg disabled:opacity-60"
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
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            Assign User
          </button>
        </form>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-200">Audit Logs</h2>
          <button onClick={loadData} className="px-3 py-1.5 text-xs bg-slate-700/70 rounded text-slate-200">
            Refresh
          </button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-400">No audit logs found.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 30).map((log) => (
              <div key={log._id} className="bg-slate-900/50 border border-slate-700/40 rounded p-3">
                <p className="text-sm text-slate-200">{log.action}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Actor: {log.actorEmail || 'n/a'} | Object: {log.objectType} ({log.objectId})
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-200">CNM Lead Exceptions</h2>
          <button onClick={loadData} className="px-3 py-1.5 text-xs bg-slate-700/70 rounded text-slate-200">
            Refresh
          </button>
        </div>
        {cnmExceptions.length === 0 ? (
          <p className="text-sm text-slate-400">No CNM lead exceptions found.</p>
        ) : (
          <div className="space-y-2">
            {cnmExceptions.slice(0, 50).map((item) => (
              <div key={item._id} className="bg-slate-900/50 border border-slate-700/40 rounded p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-200">{item.reason}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700/80 text-slate-200">
                      {item.status || 'open'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedExceptionId((prev) => (prev === item._id ? '' : item._id))
                      }
                      className="text-[11px] px-2 py-0.5 rounded bg-blue-600/80 hover:bg-blue-500/80 text-white"
                    >
                      {expandedExceptionId === item._id ? 'Hide' : 'Open'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Dealer: {item.dealerNameHint || 'n/a'} | Lead: {item.cnmLeadId || 'n/a'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Store: {item.dealerStoreId || 'n/a'} | Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'n/a'}
                </p>
                {item.details?.message ? (
                  <p className="text-xs text-amber-300/90 mt-1">Detail: {item.details.message}</p>
                ) : null}
                {expandedExceptionId === item._id ? (
                  <div className="mt-2 p-2 rounded border border-slate-700/60 bg-slate-950/60">
                    <p className="text-xs text-slate-300">
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
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
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
