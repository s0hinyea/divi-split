import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from './SessionContext';

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
    /** Returns null on success, or an error message string on failure. */
    updateProfile: (updates: Partial<Profile>) => Promise<string | null>;
    refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const { session } = useSession();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(!!session);

    const fetchProfile = async () => {
        if (!session?.user) {
            setProfile(null);
            return;
        }

        try {

            if (!profile) setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                // Auto-sync from Auth Metadata if profile is missing it (happens on first login if Supabase triggers didn't copy it)
                if (!data.username && session.user.user_metadata?.username) {
                    const syncData = {
                        username: session.user.user_metadata.username,
                        venmo_handle: data.venmo_handle || session.user.user_metadata.venmo_handle || null,
                        cashapp_handle: data.cashapp_handle || session.user.user_metadata.cashapp_handle || null,
                        full_name: data.full_name || session.user.user_metadata.full_name || null
                    };
                    setProfile({ ...data, ...syncData });
                    
                    supabase.from('profiles').upsert({ 
                        id: session.user.id, 
                        ...syncData,
                        updated_at: new Date().toISOString()
                    }).then(({ error: updateError }) => {
                        if (updateError) console.error('Error syncing profile metadata:', updateError);
                    });
                } else {
                    setProfile(data);
                }
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<Profile>): Promise<string | null> => {
        if (!session?.user) return 'Not signed in.';

        // Optimistic update
        setProfile((prev) => prev ? { ...prev, ...updates } : null);

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: session.user.id,
                    ...updates,
                    updated_at: new Date().toISOString(),
                });

            if (error) {
                // Postgres unique-constraint violation (username already taken)
                if (error.code === '23505') {
                    await fetchProfile(); // revert optimistic update
                    return 'That username is already taken. Please choose a different one.';
                }
                throw error;
            }

            return null;
        } catch (error) {
            console.error('Error updating profile:', error);
            await fetchProfile(); // revert optimistic update
            return 'We could not save your profile changes. Please try again.';
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
