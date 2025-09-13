import emailjs from '@emailjs/browser';

// EmailJS Configuration
// To set up EmailJS:
// 1. Go to https://www.emailjs.com/
// 2. Create an account and get your public key
// 3. Create a service (Gmail recommended)
// 4. Create email templates for suggestions and expressions
// 5. Replace the values below with your actual EmailJS credentials

const EMAIL_CONFIG = {
  serviceId: 'service_essa_forms', // Replace with your EmailJS service ID
  suggestionTemplateId: 'template_suggestion', // Replace with your suggestion template ID
  expressionTemplateId: 'template_expression', // Replace with your expression template ID
  publicKey: 'YOUR_PUBLIC_KEY', // Replace with your EmailJS public key
};

export const sendEmail = async (templateId: string, templateParams: any) => {
  try {
    const result = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      templateId,
      templateParams,
      EMAIL_CONFIG.publicKey
    );
    return { success: true, result };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

export const sendSuggestionEmail = (formData: any) => {
  const templateParams = {
    from_name: "ESSA Anonymous Suggestion",
    to_email: "estamstudentsassociation2425@gmail.com",
    subject: `New Anonymous Suggestion - ${formData.category}`,
    category: formData.category,
    message: formData.message,
    wants_reply: formData.wantsReply ? 'Yes' : 'No',
    contact_method: formData.contactMethod || 'None',
    contact_value: formData.contactValue || 'None',
    submission_date: new Date().toLocaleString(),
  };

  return sendEmail(EMAIL_CONFIG.suggestionTemplateId, templateParams);
};

export const sendExpressionEmail = (formData: any) => {
  const templateParams = {
    from_name: "ESSA Expression Corner",
    to_email: "estamstudentsassociation2425@gmail.com",
    subject: "New Anonymous Expression - Welfare Support Needed",
    mood: formData.mood || 'Not specified',
    message: formData.message,
    wants_reply: formData.wantsReply ? 'Yes' : 'No',
    contact_method: formData.contactMethod || 'None',
    contact_value: formData.contactValue || 'None',
    submission_date: new Date().toLocaleString(),
  };

  return sendEmail(EMAIL_CONFIG.expressionTemplateId, templateParams);
};