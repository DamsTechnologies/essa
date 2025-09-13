interface StructuredDataProps {
  data: object;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

// Common structured data schemas for ESTAM SA
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ESTAM Students' Association",
  "alternateName": "ESSA",
  "url": "https://estam-sa.com",
  "logo": "https://estam-sa.com/essa-logo.png",
  "description": "Official students' association representing and advocating for ESTAM University students",
  "foundingDate": "2020",
  "organizationType": "StudentOrganization",
  "parentOrganization": {
    "@type": "EducationalOrganization",
    "name": "ESTAM University"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "General Inquiry",
    "email": "contact@estam-sa.com",
    "availableLanguage": "English"
  },
  "sameAs": [
    "https://instagram.com/estam_sa",
    "https://linkedin.com/company/estam-students-association",
    "https://facebook.com/estam.sa",
    "https://twitter.com/estam_sa"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "ESTAM University Campus",
    "addressCountry": "Country Name"
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ESTAM Students' Association",
  "url": "https://estam-sa.com",
  "description": "Official website of ESTAM Students' Association - Your voice, your community, your future",
  "publisher": {
    "@type": "Organization",
    "name": "ESTAM Students' Association",
    "logo": "https://estam-sa.com/essa-logo.png"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://estam-sa.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const eventSchema = (eventData: {
  name: string;
  startDate: string;
  endDate?: string;
  description: string;
  location?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": eventData.name,
  "startDate": eventData.startDate,
  "endDate": eventData.endDate,
  "description": eventData.description,
  "location": {
    "@type": "Place",
    "name": eventData.location || "ESTAM University Campus"
  },
  "organizer": {
    "@type": "Organization",
    "name": "ESTAM Students' Association",
    "url": "https://estam-sa.com"
  },
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode"
});

export const articleSchema = (articleData: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": articleData.headline,
  "description": articleData.description,
  "datePublished": articleData.datePublished,
  "dateModified": articleData.dateModified || articleData.datePublished,
  "author": {
    "@type": "Organization",
    "name": articleData.author || "ESTAM Students' Association"
  },
  "publisher": {
    "@type": "Organization",
    "name": "ESTAM Students' Association",
    "logo": "https://estam-sa.com/essa-logo.png"
  }
});