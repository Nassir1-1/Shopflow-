import './globals.css';
import ClientWrapper from './components/ClientWrapper';
import MusicPlayer from './components/MusicPlayer';

export const metadata = {
  title: 'ShopFlow Art',
  description: 'Discover and collect unique artworks',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="mode-classic">
        {/* Music switches with mode — handled client-side */}
        <MusicPlayer />
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}