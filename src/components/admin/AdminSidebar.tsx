'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Brain,
    BookOpen,
    Layers,
    ChevronRight,
    Shield,
    LogOut,
    ClipboardList,
    Mail,
} from 'lucide-react';
import { removeToken } from '@/lib/auth';

const NAV_ITEMS = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
    { href: '/admin/recommendations', label: 'Recommended Courses', icon: Brain },
    { href: '/admin/course-mappings', label: 'Courses', icon: BookOpen },
    { href: '/admin/scheduling', label: 'Scheduling Blocks', icon: Layers },
    { href: '/admin/messages', label: 'Contact Messages', icon: Mail },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const handleLogout = () => {
        removeToken();
        window.location.href = '/login';
    };

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="admin-sidebar__logo">
                <div className="admin-sidebar__logo-icon">
                    <Shield size={20} />
                </div>
                <div>
                    <span className="admin-sidebar__logo-text">NUPal</span>
                    <span className="admin-sidebar__logo-badge">Admin</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="admin-sidebar__nav">
                <p className="admin-sidebar__nav-label">Management</p>
                {NAV_ITEMS.map(item => {
                    const active = isActive(item.href, item.exact);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-sidebar__nav-item ${active ? 'admin-sidebar__nav-item--active' : ''}`}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                            {active && <ChevronRight size={14} className="admin-sidebar__nav-arrow" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="admin-sidebar__footer">
                <button onClick={handleLogout} className="admin-sidebar__logout-btn">
                    <LogOut size={14} /> Sign Out
                </button>
            </div>
        </aside>
    );
}
