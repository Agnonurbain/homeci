import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function SEO({ title, description, image, url }: SEOProps) {
  const siteName = 'HOMECI - Immobilier Transparent';
  const defaultTitle = 'HOMECI | Des biens immobiliers vérifiés au meilleur prix';
  const defaultDesc = 'Trouvez et louez facilement votre prochain bien immobilier : appartements, maisons et villas. Processus de visite en ligne et sécurisé par nos notaires.';
  const defaultImage = 'https://home-ci.com/og-image.jpg'; // URL par défaut
  
  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDesc = description || defaultDesc;
  const seoImage = image || defaultImage;
  const seoUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDesc} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDesc} />
      <meta property="og:image" content={seoImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={seoUrl} />
      <meta property="twitter:title" content={seoTitle} />
      <meta property="twitter:description" content={seoDesc} />
      <meta property="twitter:image" content={seoImage} />
    </Helmet>
  );
}
