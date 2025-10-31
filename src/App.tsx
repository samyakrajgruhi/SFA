import React, { lazy, Suspense, Component, ErrorInfo, ReactNode } from "react";
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
const DeleteUser = lazy(() => import("./pages/DeleteUser"));
const BeneficiaryRequest = lazy(() => import("./pages/BeneficiaryRequest"));
const BeneficiaryReview = lazy(() => import("./pages/BeneficiaryReview"));
const Announcements = lazy(() => import("./pages/Announcements"));
const TempAdmin  = lazy(() => import("./pages/TempAdmin"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false};

  static getDerivedStateFromError() {
    return { hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:",error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
                <Route path="/announcements" element={<Announcements />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/user-info" element={<UserInfo />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/beneficiary-request" element={<BeneficiaryRequest />} />
                  <Route path="/admin" element={<AdminMenu />} />
                  <Route path="/admin/members" element={<MemberList />} />
                  <Route path="/admin/payment-amounts" element={<PaymentAmounts />} />
                  <Route path="/admin/lobbies" element={<LobbiesManagement />} />
                  <Route path="/admin/collection-members" element={<MakeCollectionMember />} />
                  <Route path="/admin/csv-import" element={<CSVImportPage />} />
                  <Route path="/admin/cleanup" element={<DatabaseCleanup />} />
                  <Route path="/admin/delete-user" element={<DeleteUser />} />
                  <Route path="/admin/beneficiary-review" element={<BeneficiaryReview />} />
                  <Route path="/temp-admin" element={<TempAdmin />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;