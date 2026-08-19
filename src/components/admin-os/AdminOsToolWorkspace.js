'use client';

import UsersPageContent from '@/app/users/UsersPageContent';
import RequestPageContent from '@/app/request/RequestPageContent';
import BlogPageContent from '@/app/blog/BlogPageContent';
import DealerBetaPageContent from '@/app/dealer-beta/DealerBetaPageContent';
import { DealerBootstrapPageContent } from '@/app/dealer-bootstrap/page';
import QueriesPage from '@/app/queries/page';
import CatalogVehiclesPanel from '@/app/catalog/CatalogVehiclesPanel';
import { SearchGovernancePageContent } from '@/app/search-governance/page';

function ToolBody({ tool }) {
  switch (tool.id) {
    case 'users':
      return <UsersPageContent />;
    case 'request':
      return <RequestPageContent />;
    case 'blog':
      return <BlogPageContent initialTab={tool.props?.tab} />;
    case 'dealer-beta':
      return <DealerBetaPageContent />;
    case 'dealer-bootstrap':
      return (
        <DealerBootstrapPageContent
          initialSection={tool.props?.section}
          initialInbox={tool.props?.inbox}
        />
      );
    case 'queries':
      return <QueriesPage />;
    case 'catalog':
      return <CatalogVehiclesPanel />;
    case 'search-governance':
      return <SearchGovernancePageContent />;
    default:
      return (
        <p className="aos-tool-fallback">
          This tool is not embedded yet. Use the legacy link if needed.
        </p>
      );
  }
}

/**
 * In-shell workspace — Admin OS sidebar stays; legacy tool opens here.
 */
export default function AdminOsToolWorkspace({ tool, onBack }) {
  if (!tool) return null;

  return (
    <section className="aos-tool" aria-label={tool.label}>
      <div className="aos-tool__bar">
        <button type="button" className="aos-tool__back" onClick={onBack}>
          ← Back to Admin OS
        </button>
        <div className="aos-tool__meta">
          <span className="aos-tool__eyebrow">Existing tool</span>
          <strong>{tool.label}</strong>
        </div>
        <span className="aos-tool__hint">Same APIs · Admin OS shell stays</span>
      </div>
      <div className="aos-tool__panel">
        <ToolBody tool={tool} />
      </div>
    </section>
  );
}
