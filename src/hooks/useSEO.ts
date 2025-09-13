import { useEffect } from 'react';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

export const useSEO = (seoData: SEOData) => {
  useEffect(() => {
    // Update document title
    document.title = `${seoData.title} | ESTAM Students' Association`;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', seoData.description);
    }

    // Update meta keywords
    if (seoData.keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', seoData.keywords);
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`);
      if (!ogTag) {
        ogTag = document.createElement('meta');
        ogTag.setAttribute('property', property);
        document.head.appendChild(ogTag);
      }
      ogTag.setAttribute('content', content);
    };

    updateOGTag('og:title', seoData.title);
    updateOGTag('og:description', seoData.description);
    updateOGTag('og:type', seoData.type || 'website');
    
    if (seoData.image) {
      updateOGTag('og:image', seoData.image);
    }
    
    if (seoData.url) {
      updateOGTag('og:url', seoData.url);
    }

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`);
      if (!twitterTag) {
        twitterTag = document.createElement('meta');
        twitterTag.setAttribute('name', name);
        document.head.appendChild(twitterTag);
      }
      twitterTag.setAttribute('content', content);
    };

    updateTwitterTag('twitter:title', seoData.title);
    updateTwitterTag('twitter:description', seoData.description);
    
    if (seoData.image) {
      updateTwitterTag('twitter:image', seoData.image);
    }

    // Update structured data
    if (seoData.structuredData) {
      let structuredDataScript = document.querySelector('#structured-data');
      if (!structuredDataScript) {
        structuredDataScript = document.createElement('script');
        structuredDataScript.setAttribute('type', 'application/ld+json');
        structuredDataScript.setAttribute('id', 'structured-data');
        document.head.appendChild(structuredDataScript);
      }
      structuredDataScript.textContent = JSON.stringify(seoData.structuredData);
    }

    // Add canonical URL
    if (seoData.url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', seoData.url);
    }
  }, [seoData]);
};

// Pre-defined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: "Home - Your Voice, Your Community",
    description: "Official website of ESTAM Students' Association - Empowering students through leadership, academic excellence, and community engagement at ESTAM University.",
    keywords: "ESTAM, students association, university students, student leadership, academic excellence, community engagement, student welfare, university events, ESSA",
    url: "https://estam-sa.com"
  },
  about: {
    title: "About Us - Mission & Vision",
    description: "Learn about ESTAM Students' Association's mission to empower students, promote academic excellence, and foster community engagement at ESTAM University.",
    keywords: "ESTAM about, student association mission, university values, academic excellence, student leadership, community engagement",
    url: "https://estam-sa.com/about"
  },
  executives: {
    title: "Executive Team - Student Leaders",
    description: "Meet the dedicated executive team of ESTAM Students' Association leading student initiatives and representing your voice at ESTAM University.",
    keywords: "ESTAM executives, student leaders, association leadership, student government, university representatives",
    url: "https://estam-sa.com/executives"
  },
  events: {
    title: "Events - Campus Activities",
    description: "Discover upcoming events, activities, and programs organized by ESTAM Students' Association to enhance your university experience.",
    keywords: "ESTAM events, university activities, campus programs, student events, academic activities, social events",
    url: "https://estam-sa.com/events"
  },
  welfare: {
    title: "Student Welfare - Support & Resources",
    description: "Access student welfare services, support resources, and advocacy programs provided by ESTAM Students' Association.",
    keywords: "student welfare, support services, student resources, advocacy, mental health, academic support, ESTAM",
    url: "https://estam-sa.com/welfare"
  },
  contact: {
    title: "Contact Us - Get in Touch",
    description: "Contact ESTAM Students' Association for inquiries, feedback, or support. We're here to serve the ESTAM University community.",
    keywords: "contact ESTAM, student association contact, feedback, inquiries, student support, ESSA contact",
    url: "https://estam-sa.com/contact"
  },
  constitution: {
    title: "Constitution - Governing Document",
    description: "Read the official constitution of ESTAM Students' Association outlining our governance, rights, and responsibilities.",
    keywords: "ESTAM constitution, student association governance, student rights, university constitution, ESSA bylaws",
    url: "https://estam-sa.com/constitution"
  },
  studentLife: {
    title: "Student Life - Campus Experience",
    description: "Explore student life at ESTAM University - clubs, societies, activities, and opportunities to enhance your university experience.",
    keywords: "ESTAM student life, university experience, campus life, student clubs, societies, activities, university community",
    url: "https://estam-sa.com/student-life"
  }
};