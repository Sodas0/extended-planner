import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import { ColorSchemeScript } from '@mantine/core';
import { Inter } from 'next/font/google';
import ClientLayout from '../components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Extended Planner',
  description: 'Personal planning and effective goal tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript 
          localStorageKey="theme-storage"
          defaultColorScheme="light"
        />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Function to set the color scheme based on storage value
                  function applyThemeFromStorage() {
                    const themeData = localStorage.getItem('theme-storage');
                    if (!themeData) return;
                    
                    try {
                      const parsedData = JSON.parse(themeData);
                      
                      // Get scheme from state structure
                      let scheme = null;
                      if (parsedData.state && parsedData.state.colorScheme) {
                        scheme = parsedData.state.colorScheme;
                      } else if (parsedData.state && parsedData.state.themeConfig && parsedData.state.themeConfig.mantineScheme) {
                        scheme = parsedData.state.themeConfig.mantineScheme;
                      }
                      
                      // Only accept valid values
                      if (scheme && (scheme === 'light' || scheme === 'dark')) {
                        // Apply the scheme to html element
                        document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
                        document.documentElement.style.colorScheme = scheme;
                        
                        // Fix the background color immediately
                        if (scheme === 'dark') {
                          document.documentElement.style.backgroundColor = '#1A1B1E';
                          document.body.style.backgroundColor = '#1A1B1E';
                        } else {
                          document.documentElement.style.backgroundColor = '#FFFFFF';
                          document.body.style.backgroundColor = '#FFFFFF';
                        }
                      }
                    } catch (e) {
                      console.error('Failed to parse theme data:', e);
                    }
                  }
                  
                  // Apply theme immediately
                  applyThemeFromStorage();
                  
                  // Create and append a style element with CSS transitions
                  const styleElement = document.createElement('style');
                  styleElement.textContent = \`
                    html, body {
                      transition: background-color 0s !important;
                    }
                    
                    /* Only add transitions after page load to prevent initial flash */
                    .theme-transitions-enabled html, .theme-transitions-enabled body {
                      transition: background-color 0.2s ease-in-out !important;
                    }
                  \`;
                  document.head.appendChild(styleElement);
                  
                  // Enable transitions after page has fully loaded
                  window.addEventListener('load', function() {
                    // Apply again after load to ensure it sticks
                    applyThemeFromStorage();
                    
                    // Enable transitions after a slight delay
                    setTimeout(function() {
                      document.documentElement.classList.add('theme-transitions-enabled');
                    }, 300);
                  });
                } catch (e) {
                  console.error('Error in theme initialization script:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
