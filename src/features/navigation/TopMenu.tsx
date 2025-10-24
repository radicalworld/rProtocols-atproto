// src/features/navigation/TopMenu.tsx
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth/SessionProvider";
import SignInDialog from "@/features/auth/SignInDialog";
import SignUpDialog from "@/features/auth/SignUpDialog";

const items = [
    { to: "/root", label: "Root" },
    { to: "/work", label: "Work" },
    { to: "/website", label: "Website" },
    { to: "/contributions", label: "MyContributions" }
];

export function TopMenu() {
    const { session, signOut } = useSession();
    const nav = useNavigate();

    return (
        <nav className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-2">
            <Link to="/" className="rounded-full px-3 py-1 text-sm font-semibold hover:bg-gray-100">
                rProtocols
            </Link>

            <ul className="flex gap-2">
                {items.map(({ to, label }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            className={({ isActive }) =>
                            `rounded-full px-4 py-2 text-sm transition ${
                                isActive ? "bg-black text-white" : "hover:bg-gray-100"
                            }`
                            }
                        >
                            {label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            {/* Right side: auth */}
            {!session ? (
                <div className="flex items-center gap-2">
                    <SignInDialog />
                    <SignUpDialog />
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                        {session.handle ?? session.did?.split("@")[0] ?? "me"}
                    </span>
                    <button onClick={signOut} className="rounded-full px-3 py-1 text-sm border">
                        Sign out
                    </button>
                </div>
            )}
        </div>
        </nav>
    );
}