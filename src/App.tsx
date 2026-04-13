import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useStore } from './store/useStore';
import { TranslationProvider } from './contexts/TranslationContext';

// Lazy loading components for performance optimization
const Home = lazy(() => import('./pages/Home'));
const Library = lazy(() => import('./pages/Library'));
const Create = lazy(() => import('./pages/Create'));
const Editor = lazy(() => import('./pages/Editor'));
const Upgrade = lazy(() => import('./pages/Upgrade'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const SignupScreen = lazy(() => import('./components/SignupScreen'));

function App() {
  const { setUser, setAuthReady, isAuthReady, user, fetchProfile, isDarkMode } = useStore();

  useEffect(() => {
    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchProfile(user.uid);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady, fetchProfile]);

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-creme dark:bg-ink">
        <div className="animate-pulse text-coffee dark:text-creme font-serif text-2xl">KŌHĪRA...</div>
      </div>
    );
  }

  return (
    <TranslationProvider>
      <div className="lofi-grain" />
      <div className="scanlines" />
      <Router>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-creme dark:bg-ink">
            <div className="animate-pulse text-coffee dark:text-creme font-serif text-2xl italic opacity-40">Preparando o café...</div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={!user ? <LoginScreen /> : <Navigate to="/library" />} 
            />
            <Route 
              path="/signup" 
              element={!user ? <SignupScreen /> : <Navigate to="/library" />} 
            />
            <Route 
              path="/library" 
              element={user ? <Library /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/create" 
              element={user ? <Create /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/editor/:workId" 
              element={user ? <Editor /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/upgrade" 
              element={user ? <Upgrade /> : <Navigate to="/login" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Router>
    </TranslationProvider>
  );
}

export default App;
