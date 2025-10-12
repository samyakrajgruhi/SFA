import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectRout.tsx";

// Lazy load page components
const Homepage = lazy(() => import("./pages/Homepage"));
const Login = lazy(() => import("./pages/Login"));
const LobbyData = lazy(() => import("./pages/LobbyData"));
const UserInfo = lazy(() => import("./pages/UserInfo"));
const Payment = lazy(() => import("./pages/Payment"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminMenu = lazy(() => import("./pages/AdminMenu"));
const MemberList = lazy(() => import("./pages/MemberList"));
const PaymentAmounts = lazy(() => import("./pages/PaymentAmounts"));
const MakeCollectionMember = lazy(() => import("./pages/MakeCollectionMember"));
const CSVImportPage = lazy(() => import("./pages/CSVImportPage"));
const DatabaseCleanup = lazy(() => import("./pages/TempAdmin"));
const LobbiesManagement = lazy(() => import("./pages/LobbiesManagement"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/lobby-data" element={<LobbyData />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/user-info" element={<UserInfo />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/admin" element={<AdminMenu />} />
                <Route path="/admin/members" element={<MemberList />} />
                <Route path="/admin/payment-amounts" element={<PaymentAmounts />} />
                <Route path="/admin/lobbies" element={<LobbiesManagement />} />
                <Route path="/admin/collection-members" element={<MakeCollectionMember />} />
                <Route path="/admin/csv-import" element={<CSVImportPage />} />
                <Route path="/admin/cleanup" element={<DatabaseCleanup />} />
              </Route>

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;