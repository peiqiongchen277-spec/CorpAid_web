import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";
import { SystemSettingsProvider } from "./contexts/systemSettingsContext";
import { Toaster } from 'sonner';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider>
            <SystemSettingsProvider>
                <BrowserRouter>
                    <App />
                    <Toaster />
                </BrowserRouter>
            </SystemSettingsProvider>
        </AuthProvider>
    </StrictMode>
);
