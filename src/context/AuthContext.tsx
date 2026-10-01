import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { fetchWithRetry } from '../utils/fetchUtils';
import { safeStorage } from '../utils/safeStorage';

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  login: (user: AuthUser, token?: string) => void;
  updateUser: (updatedFields: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  isSecretary: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Fields the browser may mirror onto users/{uid}. Passwords and privilege flags stay on the server. */
function firestoreSafeUser(data: Record<string, any>) {
  const copy = { ...data };
  delete copy.password;
  delete copy.passwordHash;
  delete copy.isAdmin;
  if (copy.role === 'Admin' || copy.role === 'Secretary') {
    delete copy.role;
  }
  return copy;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = safeStorage.getItem('arabiyya_auth_user');
      const token = safeStorage.getItem('arabiyya_auth_token');
      if (!savedUser || !token) {
        if (savedUser && !token) safeStorage.removeItem('arabiyya_auth_user');
        return null;
      }
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminRoles, setAdminRoles] = useState<{ id: string; name: string; description: string; assignedUsernames: string[] }[]>([]);

  useEffect(() => {
    const secretary = Boolean(user && (user.role === 'Secretary' || user.role === 'Admin' || user.isAdmin === true));
    if (!secretary || !safeStorage.getItem('arabiyya_auth_token')) return;
    fetchWithRetry('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.admin_roles) {
          setAdminRoles(data.admin_roles);
        }
      })
      .catch(err => console.error('Failed to fetch admin roles:', err));
  }, [user]);

  const isSecretary = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'Secretary' || user.role === 'Admin' || user.isAdmin === true) return true;

    for (const role of adminRoles) {
      if (role.assignedUsernames && Array.isArray(role.assignedUsernames)) {
        const lowerAssigned = role.assignedUsernames.map(u => u.toLowerCase());
        if (user.username && lowerAssigned.includes(user.username.toLowerCase())) return true;
        if (user.email && lowerAssigned.includes(user.email.toLowerCase())) return true;
        if (user.id && lowerAssigned.includes(user.id.toLowerCase())) return true;
      }
    }
    return false;
  }, [user, adminRoles]);

  // Synchronize local session and Firebase Auth state
  useEffect(() => {
    const savedUser = safeStorage.getItem('arabiyya_auth_user');
    const savedToken = safeStorage.getItem('arabiyya_auth_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // If we have a cached local session, release loading immediately to prevent blank/stuck screen
        setIsLoading(false);
      } catch (e) {
        safeStorage.removeItem('arabiyya_auth_user');
      }
    }

    // Failsafe timer: Ensure isLoading is ALWAYS released within 500ms regardless of network/auth state
    const failsafeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    // Listen to Firebase Auth state safely
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data() as AuthUser;
            const isUserAdmin = data.role === 'Admin' ||
                                data.role === 'Secretary' ||
                                data.isAdmin === true;
            if (isUserAdmin) {
              let needsUpdate = false;
              if (data.isAdmin !== true) {
                data.isAdmin = true;
                needsUpdate = true;
              }
              const newRole = data.role === 'Admin' || data.role === 'Secretary' ? data.role : 'Secretary';
              if (data.role !== newRole) {
                data.role = newRole;
                needsUpdate = true;
              }
              if (needsUpdate) {
                await setDoc(userDocRef, firestoreSafeUser({ ...data, role: data.role }), { merge: true }).catch(err => {
                  console.warn('Firestore user profile sync warning:', err);
                });
              }
            }
            setUser(data);
            safeStorage.setItem('arabiyya_auth_user', JSON.stringify(data));
          } else {
            const fallbackUser: AuthUser = {
              id: fbUser.uid,
              username: fbUser.email ? fbUser.email.split('@')[0] : 'scout_user',
              fullName: fbUser.displayName || 'Arabiyya Scout Member',
              commonName: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'Member',
              role: 'Rover',
              idCardNumber: '',
              email: fbUser.email || '',
              status: 'Investiture',
              awardGoal: 'Baden-Powell Award',
              awardIntent: true,
              currentLevel: 'Scout Standard'
            };

            await setDoc(userDocRef, firestoreSafeUser(fallbackUser), { merge: true });
            setUser(fallbackUser);
            safeStorage.setItem('arabiyya_auth_user', JSON.stringify(fallbackUser));
          }
        } catch (err) {
          console.warn('[Firebase Auth Sync Exception]:', err);
        }
      }

      // Always guarantee release of loading state
      clearTimeout(failsafeTimer);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(failsafeTimer);
      unsubscribe();
    };
  }, []);

  const login = (userData: AuthUser, token?: string) => {
    setUser(userData);
    safeStorage.setItem('arabiyya_auth_user', JSON.stringify(userData));
    if (token) safeStorage.setItem('arabiyya_auth_token', token);
    else safeStorage.removeItem('arabiyya_auth_token');

    // Also persist user profile to Firestore
    try {
      const userRef = doc(db, 'users', userData.id || userData.username);
      setDoc(userRef, firestoreSafeUser(userData), { merge: true }).catch(err => {
        console.warn('Firestore user profile sync warning:', err);
      });
    } catch (e) {
      console.warn('Firestore doc write warning:', e);
    }
  };

  const updateUser = (updatedFields: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      
      const isCurrentlyAdmin = prev.role === 'Admin' ||
                               prev.role === 'Secretary' ||
                               prev.isAdmin === true;

      const merged: AuthUser = { ...prev, ...updatedFields };

      if (isCurrentlyAdmin) {
        merged.isAdmin = true;
        if (!merged.role) {
          merged.role = prev.role || 'Secretary';
        }
        if (prev.id && prev.id !== 'admin-001') {
          merged.id = prev.id;
        }
      } else {
        merged.isAdmin = prev.isAdmin;
      }

      safeStorage.setItem('arabiyya_auth_user', JSON.stringify(merged));
      // Persist to Firestore as well
      try {
        const docId = merged.id || merged.idCardNumber || merged.username || 'admin';
        const userRef = doc(db, 'users', docId);
        setDoc(userRef, firestoreSafeUser(merged), { merge: true }).catch(err => {
          console.warn('Firestore user update warning:', err);
        });
      } catch (e) {
        console.warn('Firestore doc write warning:', e);
      }
      return merged;
    });
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    setUser(null);
    setFirebaseUser(null);
    safeStorage.removeItem('arabiyya_auth_user');
    safeStorage.removeItem('arabiyya_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, updateUser, logout, isLoading, isSecretary }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
