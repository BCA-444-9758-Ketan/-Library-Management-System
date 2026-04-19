import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import MyLoans from "./pages/MyLoans";
import Reservations from "./pages/Reservations";
import Recommendations from "./pages/Recommendations";
import Branches from "./pages/Branches";
import Users from "./pages/admin/Users";
import AuditLog from "./pages/admin/AuditLog";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const Protected = ({ children, roles }: { children: React.ReactNode; roles?: ("student" | "librarian" | "admin")[] }) => (
  <ProtectedRoute roles={roles}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/books" element={<Protected><Books /></Protected>} />
            <Route path="/loans" element={<Protected><MyLoans /></Protected>} />
            <Route path="/reservations" element={<Protected><Reservations /></Protected>} />
            <Route path="/branches" element={<Protected><Branches /></Protected>} />
            <Route path="/recommendations" element={<Protected><Recommendations /></Protected>} />

            <Route path="/admin/users" element={<Protected roles={["admin"]}><Users /></Protected>} />
            <Route path="/admin/audit" element={<Protected roles={["admin"]}><AuditLog /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
