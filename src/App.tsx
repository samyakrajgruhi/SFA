import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import LobbyData from "./pages/LobbyData";
import UserInfo from "./pages/UserInfo";
import Payment from "./pages/Payment";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectRout.tsx";
import ForgotPassword from "./pages/ForgotPassword";
import AdminManagement from "./pages/AdminManagement"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lobby-data" element={<LobbyData />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/user-info" element={<UserInfo />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/admin" element={<AdminManagement />} />
            </Route >


            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
