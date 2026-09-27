'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  created_at: string;
  is_active: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
    }
  }, [isAuthenticated, loadUserProfile]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error || 'Failed to load profile'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      {success && <div className="bg-green-50 p-4 rounded-lg mb-4 text-green-700">{success}</div>}
      {error && <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-700">{error}</div>}
      
      <div className="max-w-2xl bg-gray-50 p-6 rounded-lg">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <p className="text-gray-900">{userProfile.email}</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <p className="text-gray-900">{userProfile.full_name}</p>
        </div>
        
        {userProfile.phone_number && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <p className="text-gray-900">{userProfile.phone_number}</p>
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
          <p className="text-gray-900">{new Date(userProfile.created_at).toLocaleDateString()}</p>
        </div>
        
        <button
          onClick={() => router.push('/auth/change-password')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}
