import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  schema?: Record<string, any>;
}

export function SEO({
  title = "Maheshwari Public School, Ajmer Alumni Connect | MPS Ajmer",
  description = "Official Alumni Network for Maheshwari Public School (MPS), Ajmer. Reconnect with former classmates, find exclusive job opportunities, and engage in lifelong learning.",
  keywords = "MPS Ajmer, Maheshwari Public School Ajmer, MPS Ajmer Alumni, MPS Ajmer Network, Ajmer Best School, MPS Connect, Graduation, Community",
  image = "/logo.png",
  url = "/",
  schema
}: SEOProps) {
  // Dynamically get the current domain (supports multiple live domains like connect.mpsajmer.com and mpsajmer.raghavagarwal.com)
  const origin = typeof window !== 'undefined' ? window.location.origin : "https://mpsajmer.raghavagarwal.com";
  
  const path = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = url.startsWith('http') ? url : `${origin}${path === '/' ? '' : path}`;
  const fullImageUrl = image.startsWith('http') ? image : `${origin}${image.startsWith('/') ? '' : '/'}${image}`;
  
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* OpenGraph Metadata */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="MPS Ajmer Connect" />

      {/* Twitter Metadata */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Optional Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
