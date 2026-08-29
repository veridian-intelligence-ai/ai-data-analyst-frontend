import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { protectedRedirect, publicRedirect } from './lib/routeGuards';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ChatPage } from './pages/ChatPage';

/**
 * Route guards delegate the decision to lib/routeGuards.ts (pure, tested);
 * these wrappers only wire the decision into the router.
 */
function Protected({ children }: { children: ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return null; // don't bounce to /login before boot finishes
  const redirect = protectedRedirect({ isAuthenticated });
  return redirect ? <Navigate to={redirect} replace /> : children;
}

function PublicOnly({ children }: { children: ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  const redirect = publicRedirect({ isAuthenticated });
  return redirect ? <Navigate to={redirect} replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/chat"
            element={
              <Protected>
                <ChatPage />
              </Protected>
            }
          />
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
