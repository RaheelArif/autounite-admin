/**
 * Admin route layout — force-load BuildX shell CSS (design only).
 */
import './admin-os.css';

export default function AdminLayout({ children }) {
  return (
    <div className="aos-root" data-admin-os="1">
      {children}
    </div>
  );
}
