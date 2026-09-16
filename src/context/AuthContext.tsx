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
  login: (user: AuthUser) => void;
  updateUser: (updatedFields: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  isSecretary: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = safeStorage.getItem('arabiyya_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminRoles, setAdminRoles] = useState<{ id: string; name: string; description: string; assignedUsernames: string[] }[]>([]);

  useEffect(() => {
    fetchWithRetry('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.admin_roles) {
          setAdminRoles(data.admin_roles);
        }
      })
      .catch(err => console.error('Failed to fetch admin roles:', err));
  }, []);

  const isSecretary = React.useMemo(() => {
    if (!user) return false;
    if (user.role === 'Secretary' || user.role === 'Admin' || user.isAdmin === true) return true;
    if (user.username === 'admin' || user.email === 'it@arabiyyascouts.org' || user.email === 'admin@arabiyyarovers.net' || user.email === 'nazihnafiz@gmail.com') return true;
    
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
    if (savedUser) {
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
            const isUserAdmin = fbUser.email === 'it@arabiyyascouts.org' || 
                                fbUser.email === 'admin@arabiyyarovers.net' || 
                                fbUser.email === 'nazihnafiz@gmail.com' ||
                                fbUser.email?.includes('admin') ||
                                data.idCardNumber?.trim().toUpperCase() === 'A000000' ||
                                data.role === 'Admin' ||
                                data.role === 'Secretary' ||
                                data.isAdmin === true;
            if (isUserAdmin) {
              let needsUpdate = false;
              if (data.isAdmin !== true) {
                data.isAdmin = true;
                needsUpdate = true;
              }
              const newRole = 'Secretary';
              if (data.role !== newRole) {
                data.role = newRole;
                needsUpdate = true;
              }
              if (data.idCardNumber !== 'A000000') {
                data.idCardNumber = 'A000000';
                needsUpdate = true;
              }
              if (fbUser.email === 'nazihnafiz@gmail.com' && data.email !== 'it@arabiyyascouts.org') {
                data.email = 'it@arabiyyascouts.org';
                needsUpdate = true;
              }
              if (needsUpdate) {
                await setDoc(userDocRef, { 
                  isAdmin: true, 
                  role: newRole,
                  idCardNumber: 'A000000',
                  email: fbUser.email === 'nazihnafiz@gmail.com' ? 'it@arabiyyascouts.org' : fbUser.email
                }, { merge: true });
              }
            }
            setUser(data);
            safeStorage.setItem('arabiyya_auth_user', JSON.stringify(data));
          } else {
            const isAdmin = fbUser.email === 'it@arabiyyascouts.org' || 
                            fbUser.email === 'admin@arabiyyarovers.net' || 
                            fbUser.email === 'nazihnafiz@gmail.com' ||
                            fbUser.email?.includes('admin');
            const fallbackUser: AuthUser = {
              id: fbUser.uid,
              username: fbUser.email ? fbUser.email.split('@')[0] : 'scout_user',
              fullName: isAdmin ? 'Ahmed Nazih Nafiz' : (fbUser.displayName || 'Arabiyya Scout Member'),
              commonName: isAdmin ? 'Ahmed' : (fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'Member'),
              role: isAdmin ? 'Secretary' : 'Rover',
              idCardNumber: isAdmin ? 'A000000' : 'A' + Math.floor(100000 + Math.random() * 900000),
              email: isAdmin ? 'it@arabiyyascouts.org' : (fbUser.email || ''),
              status: 'Investiture',
              awardGoal: 'Baden-Powell Award',
              awardIntent: true,
              currentLevel: 'Scout Standard',
              isAdmin: isAdmin ? true : undefined
            };

            await setDoc(userDocRef, fallbackUser, { merge: true });
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

  const login = (userData: AuthUser) => {
    setUser(userData);
    safeStorage.setItem('arabiyya_auth_user', JSON.stringify(userData));

    // Also persist user profile to Firestore
    try {
      const userRef = doc(db, 'users', userData.id || userData.username);
      setDoc(userRef, userData, { merge: true }).catch(err => {
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
                               prev.isAdmin === true ||
                               prev.email === 'it@arabiyyascouts.org' || 
                               prev.email === 'nazihnafiz@gmail.com' ||
                               prev.idCardNumber === 'A000000' ||
                               updatedFields.email === 'it@arabiyyascouts.org' ||
                               updatedFields.email === 'nazihnafiz@gmail.com' ||
                               updatedFields.idCardNumber === 'A000000' ||
                               updatedFields.isAdmin === true;

      const merged: AuthUser = { ...prev, ...updatedFields };

      if (isCurrentlyAdmin) {
        merged.isAdmin = true;
        merged.idCardNumber = 'A000000';
        if (!merged.role) {
          merged.role = prev.role || 'Secretary';
        }
        if (prev.id && prev.id !== 'admin-001') {
          merged.id = prev.id;
        }
      }

      safeStorage.setItem('arabiyya_auth_user', JSON.stringify(merged));
      // Persist to Firestore as well
      try {
        const docId = merged.id || merged.idCardNumber || merged.username || 'admin';
        const userRef = doc(db, 'users', docId);
        setDoc(userRef, merged, { merge: true }).catch(err => {
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
