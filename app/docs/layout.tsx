import { AppFooter } from '@/components/app-footer';
import { AppHeader } from '@/components/nLHeader'
import { getServerSession } from 'next-auth';
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = async ({ children }) => {
    const session = await getServerSession();
    return (
        <div className="">
            <AppHeader initialSession={session} />
            {children}
            <AppFooter />
        </div>
    );
};

export default Layout;