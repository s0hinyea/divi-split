import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SessionContextValue = {
    session: Session | null;
    isLoading: boolean;
};

export const SessionContext = createContext<SessionContextValue>({
    session: null,
    isLoading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadSession = async () => {
            try {
                const { data } = await supabase.auth.getSession();

                if (isMounted) {
                    setSession(data.session);
                }
            } catch (error) {
                console.error('Error loading session:', error);

                if (isMounted) {
                    setSession(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (!isMounted) return;

            setSession(nextSession);

            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery event detected');
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <SessionContext.Provider value={{ session, isLoading }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}
