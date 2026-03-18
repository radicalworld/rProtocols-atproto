import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useSession } from "@/features/auth/SessionProvider";
import SignInDialog from "@/features/auth/SignInDialog";
import SignUpDialog from "@/features/auth/SignUpDialog";
import { Menu, MoreHorizontal } from "lucide-react";
const NAV_LINKS = [
    { to: "/collaboration", label: "Collaboration" },
    { to: "/work", label: "Work" },
    { to: "/website", label: "Website" },
    { to: "/contributions", label: "MyContributions" }
];
export function TopMenu() {
    const { session, signOut } = useSession();
    const nav = useNavigate();
    const location = useLocation();
    const [isLeftMenuOpen, setIsLeftMenuOpen] = useState(false);
    const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
    const [isAuthMenuOpen, setIsAuthMenuOpen] = useState(false);
    // We need to keep the dropdown mounted while a dialog is open
    // so the Radix Dialog doesn't crash from losing its trigger
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const leftMenuRef = useRef(null);
    const rightMenuRef = useRef(null);
    const authMenuRef = useRef(null);
    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leftMenuRef.current && !leftMenuRef.current.contains(event.target)) {
                setIsLeftMenuOpen(false);
            }
            if (rightMenuRef.current && !rightMenuRef.current.contains(event.target)) {
                setIsRightMenuOpen(false);
            }
            if (authMenuRef.current && !authMenuRef.current.contains(event.target)) {
                // Only close the auth menu if no dialog is taking focus
                setIsAuthMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    // Derived Title logic mapping paths to strings
    let protocolTitle = "Framework"; // Default title
    if (location.pathname.startsWith('/collaboration'))
        protocolTitle = "Collaboration";
    else if (location.pathname.startsWith('/work'))
        protocolTitle = "Work";
    if (location.pathname.startsWith('/website'))
        protocolTitle = "Website";
    if (location.pathname.startsWith('/contributions'))
        protocolTitle = "MyContributions";
    if (location.pathname.startsWith('/suite'))
        protocolTitle = "Suite Profile";
    if (location.pathname.startsWith('/protocol'))
        protocolTitle = "Protocol Profile";
    if (location.pathname.startsWith('/needs'))
        protocolTitle = "Need Profile";
    return (_jsx("nav", { className: "sticky top-0 z-50 w-full px-2 pt-2.5 sm:p-2 bg-transparent pointer-events-none", children: _jsxs("div", { className: "flex flex-row items-center justify-between w-full h-11", children: [_jsxs("div", { className: "pointer-events-auto flex items-center gap-2 flex-shrink-0 relative", ref: leftMenuRef, children: [_jsx(Link, { to: "/", className: "flex items-center justify-center pl-1", children: _jsx("img", { src: "/images/rNeoPub-symbol.svg", alt: "rNeoPub Symbol", className: "w-7 h-7 object-contain" }) }), _jsx("button", { onClick: () => setIsLeftMenuOpen(!isLeftMenuOpen), className: "w-10 h-10 flex justify-center items-center rounded-full bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-neutral-800 dark:text-neutral-200", "aria-label": "Navigation Menu", children: _jsx(Menu, { className: "w-5 h-5" }) }), isLeftMenuOpen && (_jsx("div", { className: "absolute left-0 top-full mt-2 w-48 p-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-xl rounded-2xl z-50 border border-gray-200/50 dark:border-gray-800/50 flex flex-col gap-1", children: NAV_LINKS.map(({ to, label }) => (_jsx(NavLink, { to: to, onClick: () => setIsLeftMenuOpen(false), className: ({ isActive }) => `px-3 py-2 text-sm rounded-xl transition ${isActive ? "bg-black text-white dark:bg-white dark:text-black font-medium" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"}`, children: label }, to))) }))] }), _jsx("div", { className: "pointer-events-auto flex items-center justify-center px-4 py-1.5 bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-sm rounded-full flex-1 mx-2 h-10 min-w-0 border border-gray-200/50 dark:border-gray-800/50", children: _jsx("p", { className: "text-center text-xs font-bold uppercase tracking-wider text-black dark:text-white opacity-90 truncate whitespace-nowrap shrink min-w-0", children: protocolTitle }) }), _jsx("div", { className: "pointer-events-auto flex justify-end flex-shrink-0 gap-1", children: _jsxs("div", { className: "flex items-center gap-1 px-1 sm:px-1.5 bg-white/60 dark:bg-black/60 backdrop-blur-xl shadow-sm rounded-full h-10 border border-gray-200/50 dark:border-gray-800/50", children: [_jsxs("div", { className: "relative flex items-center", ref: rightMenuRef, children: [_jsx("button", { onClick: () => setIsRightMenuOpen(!isRightMenuOpen), className: "w-8 h-8 flex justify-center items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all text-neutral-800 dark:text-neutral-200", "aria-label": "More options", children: _jsx(MoreHorizontal, { className: "w-5 h-5" }) }), isRightMenuOpen && (_jsxs("div", { className: "absolute right-0 top-full mt-2 p-2 w-max bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-xl rounded-2xl z-50 flex flex-col gap-2 border border-gray-200/50 dark:border-gray-800/50", children: [_jsx("div", { className: "px-2 py-1.5 text-sm text-neutral-500 cursor-not-allowed", children: "Settings (coming soon)" }), _jsx("div", { className: "px-2 py-1.5 text-sm text-neutral-500 cursor-not-allowed", children: "Share (coming soon)" })] }))] }), _jsxs("div", { className: "relative flex items-center", ref: authMenuRef, children: [_jsx("button", { onClick: () => setIsAuthMenuOpen(!isAuthMenuOpen), className: "w-8 h-8 flex justify-center items-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all text-neutral-800 dark:text-neutral-200", "aria-label": "Account", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", fill: session ? "currentColor" : "none", viewBox: "0 0 24 24", strokeWidth: session ? 0 : 1.5, stroke: "currentColor", className: `w-5 h-5 ${session ? "text-blue-600 dark:text-blue-500" : ""}`, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" }) }) }), (isAuthMenuOpen || isDialogOpen) && (_jsx("div", { className: `absolute right-0 top-full mt-2 p-2 w-max bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-xl rounded-2xl z-50 flex flex-col gap-2 border border-gray-200/50 dark:border-gray-800/50 ${!isAuthMenuOpen && isDialogOpen ? 'opacity-0 pointer-events-none' : ''}`, children: !session ? (_jsxs("div", { className: "flex flex-col gap-2 min-w-[120px]", children: [_jsx("div", { className: "w-full flex justify-center", onClick: (e) => { e.stopPropagation(); }, children: _jsx(SignInDialog, { onOpenChange: (open) => setIsDialogOpen(open) }) }), _jsx("div", { className: "w-full flex justify-center", onClick: (e) => { e.stopPropagation(); }, children: _jsx(SignUpDialog, { onOpenChange: (open) => setIsDialogOpen(open) }) })] })) : (_jsxs("div", { className: "flex flex-col gap-2 p-1", children: [_jsxs("div", { className: "text-xs font-medium text-neutral-500 mb-1 px-1", children: ["Signed in as ", _jsx("span", { className: "text-black dark:text-white font-semibold", children: session.handle ?? session.did?.split("@")[0] ?? "me" })] }), _jsx("button", { onClick: () => { signOut(); setIsAuthMenuOpen(false); }, className: "w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 border border-transparent transition", children: "Sign out" })] })) }))] })] }) })] }) }));
}
