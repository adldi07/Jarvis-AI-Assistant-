import AuthProvider from '@/components/AuthProvider';
import './globals.css';

export const metadata = {
    title: 'Jarvis AI SaaS',
    description: 'Generate web apps in seconds with AI.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
