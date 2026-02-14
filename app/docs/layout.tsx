import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/nLHeader'
import { getSession } from '@/lib/session';
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = async ({ children }) => {
    const session = await getSession();
    return (
        <div className="">
            <AppHeader initialSession={session} />
            {children}
            <AppFooter />
        </div>
    );
};

export default Layout;