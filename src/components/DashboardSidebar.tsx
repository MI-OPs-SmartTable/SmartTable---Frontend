import type { ReactNode } from "react";

type NavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

type DashboardSidebarProps = {
  menuOpen: boolean;
  navItems: NavItem[];
  currentPath: string;
  userDisplayName: string;
  userInitial: string;
  onCloseMenu: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  icons: {
    pos: ReactNode;
    close: ReactNode;
    logout: ReactNode;
  };
};

export default function DashboardSidebar({
  menuOpen,
  navItems,
  currentPath,
  userDisplayName,
  userInitial,
  onCloseMenu,
  onNavigate,
  onLogout,
  icons,
}: DashboardSidebarProps) {
  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="db-sidebar-overlay"
          onClick={onCloseMenu}
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`db-sidebar${menuOpen ? " open" : ""}`}>
        <button
          type="button"
          className="db-sidebar-close"
          onClick={onCloseMenu}
          aria-label="Cerrar menú"
        >
          {icons.close}
        </button>

        <div className="db-brand">
          <div className="db-brand-icon">{icons.pos}</div>
          <div>
            <div className="db-brand-name">SmarTable</div>
            <div className="db-brand-sub">Punto de Venta</div>
          </div>
        </div>

        <nav className="db-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`db-nav-item ${currentPath === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="db-user" onClick={onLogout}>
          <div className="db-user-avatar">{userInitial}</div>
          <div>
            <div className="db-user-name">{userDisplayName}</div>
            <div className="db-user-role">Cerrar sesión</div>
          </div>
          <div className="db-user-chevron">{icons.logout}</div>
        </div>
      </aside>
    </>
  );
}
