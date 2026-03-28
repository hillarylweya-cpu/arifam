import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  addDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, AuthLog } from './types';
import FarmerPortal from './components/FarmerPortal';
import AdminPortal from './components/AdminPortal';
import OperatorPortal from './components/OperatorPortal';
import LoginHero from './components/LoginHero';
import { Layout } from './components/Layout';
import { Loader2, Sprout, Eye, EyeOff, MapPin, Globe, Phone, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Auth Config Status
  const [authConfigStatus, setAuthConfigStatus] = useState({
    emailEnabled: true, // Optimistic default
    domainAuthorized: true, // Optimistic default
    lastError: null as string | null
  });

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    fullName: '',
    country: '',
    otp: '',
    rememberMe: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setProfile(data);
            
            // Auto-detect location if not set
            if (!data.location) {
              detectLocation(firebaseUser.uid);
            }
          } else {
            // If profile doesn't exist (e.g., first Google login), create it
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'Farmer',
              displayName: firebaseUser.displayName || 'New Farmer',
              units: 'metric',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          setError("Failed to load user profile.");
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logAuthError = async (errorCode: string, errorMessage: string, email?: string, mode: string = 'unknown') => {
    try {
      await addDoc(collection(db, 'auth_logs'), {
        timestamp: new Date().toISOString(),
        errorCode,
        errorMessage,
        email: email || 'N/A',
        authMode: mode,
        domain: window.location.hostname
      });
    } catch (err) {
      console.error("Failed to log auth error to Firestore:", err);
    }
  };

  const detectLocation = async (uid: string) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse Geocode (Mock for now, or use an API if key provided)
          // In a real app, fetch from a geocoding service
          const placeName = "Detected Location"; 
          
          await updateDoc(doc(db, 'users', uid), {
            location: { lat: latitude, lng: longitude },
            city: "Detected City",
            region: "Detected Region",
            country: "Detected Country"
          });
          
          // Refresh profile
          const updatedDoc = await getDoc(doc(db, 'users', uid));
          setProfile(updatedDoc.data() as UserProfile);
        } catch (err) {
          console.error("Location update error:", err);
        }
      }, (err) => {
        console.warn("Geolocation permission denied or error:", err);
      });
    }
  };

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 10;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return minLength && hasUpper && hasLower && hasNumber && hasSymbol;
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*]/.test(pass)) score++;
    return score; // 0-5
  };

  const retryAuth = async (authFn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await authFn();
      } catch (err: any) {
        lastError = err;
        // Only retry on network errors
        if (err.code !== 'auth/network-request-failed') throw err;
        
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Auth network error, retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await retryAuth(() => signInWithPopup(auth, provider));
      setAuthConfigStatus(prev => ({ ...prev, domainAuthorized: true }));
    } catch (err: any) {
      console.error("Google login error:", err);
      await logAuthError(err.code, err.message, undefined, 'google');
      
      if (err.code === 'auth/unauthorized-domain') {
        setAuthConfigStatus(prev => ({ ...prev, domainAuthorized: false }));
        setError("This domain is not authorized in Firebase. Please add it to the 'Authorized domains' list in the Firebase Console.");
      } else {
        setError(err.message || "Google login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        await setPersistence(
          auth, 
          formData.rememberMe ? browserLocalPersistence : browserSessionPersistence
        );
        
        await retryAuth(() => signInWithEmailAndPassword(auth, formData.email, formData.password));
        setAuthConfigStatus(prev => ({ ...prev, emailEnabled: true }));
      } else if (authMode === 'signup') {
        if (!validatePassword(formData.password)) {
          throw new Error("Password does not meet security requirements.");
        }
        
        const userCredential = await retryAuth(() => createUserWithEmailAndPassword(auth, formData.email, formData.password));
        const newProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: formData.email,
          phone: formData.phone,
          role: 'Farmer',
          displayName: formData.fullName,
          country: formData.country,
          units: 'metric',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
        setProfile(newProfile);
      } else if (authMode === 'forgot') {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, phone: formData.phone, code })
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        alert("Reset code sent! (Check console for mock code: " + code + ")");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      await logAuthError(err.code, err.message, formData.email, authMode);

      if (err.code === 'auth/operation-not-allowed') {
        setAuthConfigStatus(prev => ({ ...prev, emailEnabled: false }));
        setError("Email/Password sign-in is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. We tried to reconnect but failed. Please check your internet connection.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthConfigStatus(prev => ({ ...prev, domainAuthorized: false }));
        setError("This domain is not authorized in Firebase. Please add it to the 'Authorized domains' list in the Firebase Console.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
          <p className="text-stone-600 font-medium">Loading AgriFarm...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const strength = getPasswordStrength(formData.password);
    return (
      <LoginHero
        authMode={authMode}
        setAuthMode={setAuthMode}
        formData={formData}
        setFormData={setFormData}
        handleAuth={handleAuth}
        error={error}
        loading={loading}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        strength={strength}
        handleGoogleLogin={handleGoogleLogin}
        authConfigStatus={authConfigStatus}
      />
    );
  }

  return (
    <Layout profile={profile} onLogout={handleLogout}>
      {profile?.role === 'Farmer' && <FarmerPortal profile={profile} />}
      {profile?.role === 'Admin' && <AdminPortal profile={profile} />}
      {profile?.role === 'Drone Operator' && <OperatorPortal profile={profile} />}
    </Layout>
  );
}
