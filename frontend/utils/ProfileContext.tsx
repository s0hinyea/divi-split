import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { SessionContext } from '../app/_layout';

export interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    venmo_handle: string | null;
    cashapp_handle: string | null;
    zelle_number: string | null;
    updated_at: string | null;
}

type ProfileContextType = {
    profile: Profile | null;
    loading: boolean;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const { session } = useContext(SessionContext);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(!!session);

    const fetchProfile = async () => {
        if (!session?.user) {
            setProfile(null);
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!session?.user) return;

        try {
            // Optimistic update
            setProfile((prev) => prev ? { ...prev, ...updates } : null);

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    ...updates,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            // Revert optimistic update on error (optional, simplified here)
            await fetchProfile();
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session]);

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile: fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
