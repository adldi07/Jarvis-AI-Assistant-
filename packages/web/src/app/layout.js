import './globals.css';

export const metadata = {
    title: 'Jarvis AI Assistant',
    description: 'Generate web apps in seconds with AI.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
