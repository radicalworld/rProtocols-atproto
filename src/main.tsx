// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App'
// import SignupForm from '@/features/signup/SignupForm'
import { RepoProvider } from "@/domain/repo";
import { SessionProvider } from "@/features/auth/SessionProvider";
import './index.css'

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <SessionProvider>
            <RepoProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </RepoProvider>
        </SessionProvider>
    </React.StrictMode>
);