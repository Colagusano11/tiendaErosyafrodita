import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        const gaId = import.meta.env.VITE_GA_ID;
        if (gaId && gaId !== 'G-XXXXXXXXXX' && typeof window.gtag === 'function') {
            window.gtag('config', gaId, {
                page_path: location.pathname + location.search + location.hash,
            });
        }
    }, [location]);

    return null;
};

export default GoogleAnalytics;
