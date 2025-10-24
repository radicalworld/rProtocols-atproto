import { Link } from "react-router-dom";

export function HomePage() {
    return (
        <div className="mx-auto max-w-5xl space-y-8 p-6">
            <h1 className="text-3xl font-semibold">rProtocols</h1>
            <p className="text-gray-700 max-w-3xl">
                rProtocols are open, living agreements for how we collaborate and build together.
                Each protocol is linked to a human <strong>Need</strong> — a question about how
                we can serve life better — and grouped into <strong>Suites</strong> that
                connect related practices.
            </p>

            <div className="grid gap-6 sm:grid-cols-3 mt-8">
                {[
                { to: "/root", title: "Root Protocols", desc: "How open collaboration works." },
                { to: "/work", title: "Work Protocols", desc: "How we collaborate in work." },
                { to: "/website", title: "Website Protocols", desc: "How we share and communicate online." },
                ].map(({ to, title, desc }) => (
                <Link
                    key={to}
                    to={to}
                    className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition bg-white"
                >
                    <h2 className="text-xl font-semibold mb-2">{title}</h2>
                    <p className="text-gray-600">{desc}</p>
                </Link>
                ))}
            </div>

            <section className="mt-10">
                <h2 className="text-2xl font-semibold">How It Works</h2>
                <p className="text-gray-700 mt-2 max-w-3xl">
                    Each <strong>Need</strong> asks a question about collaboration or life.  
                    Each <strong>Protocol</strong> offers an experimental answer.  
                    <strong> Suites</strong> group related protocols together, making it easier to find patterns
                    that work in different contexts.
                </p>
            </section>
        </div>
    );
}