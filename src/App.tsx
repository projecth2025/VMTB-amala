import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CasesProvider } from './context/CasesContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { MyCases } from './pages/MyCases';
import { NewCaseStep1 } from './pages/NewCaseStep1';
import { NewCaseStep2 } from './pages/NewCaseStep2';
import { ReviewCase } from './pages/ReviewCase';
import { MTBs } from './pages/MTBs';
import { MTBDetail } from './pages/MTBDetail';
import { ViewCase } from './pages/ViewCase';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CasesProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/my-cases"
              element={
                <ProtectedRoute>
                  <MyCases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/new/step-1"
              element={
                <ProtectedRoute>
                  <NewCaseStep1 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/new/step-2"
              element={
                <ProtectedRoute>
                  <NewCaseStep2 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases/review"
              element={
                <ProtectedRoute>
                  <ReviewCase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mtbs"
              element={
                <ProtectedRoute>
                  <MTBs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mtb/:id"
              element={
                <ProtectedRoute>
                  <MTBDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/case/:id"
              element={
                <ProtectedRoute>
                  <ViewCase />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </CasesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
