import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'LocalBlue <notifications@localblue.co>';

  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

interface LeadNotificationData {
  businessName: string;
  businessEmail: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  leadMessage: string;
  serviceName?: string;
}

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/** Strip CRLF to prevent email header injection */
function sanitizeHeaderValue(text: string): string {
  return text.replace(/[\r\n]/g, ' ').trim();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendLeadNotification(data: LeadNotificationData): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const safeName = escapeHtml(data.leadName);
    const safeEmail = escapeHtml(data.leadEmail);
    const safePhone = data.leadPhone ? escapeHtml(data.leadPhone) : '';
    const safeMessage = escapeHtml(data.leadMessage);
    const safeBusinessName = escapeHtml(data.businessName);
    const safeServiceName = data.serviceName ? escapeHtml(data.serviceName) : '';
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead from ${safeBusinessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Lead Received!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Someone is interested in your services</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 18px; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Contact Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 120px; color: #64748b; font-weight: 500;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        ${safePhone ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="tel:${safePhone}" style="color: #2563eb; text-decoration: none;">${safePhone}</a>
          </td>
        </tr>
        ` : ''}
        ${safeServiceName ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Service</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${safeServiceName}</td>
        </tr>
        ` : ''}
      </table>
      
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">Message</h3>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <p style="margin: 0; color: #475569; white-space: pre-wrap;">${safeMessage}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <a href="mailto:${safeEmail}?subject=Re: Your inquiry to ${safeBusinessName}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Reply to ${safeName}
      </a>
    </div>
    
    <p style="margin: 24px 0 0; text-align: center; color: #94a3b8; font-size: 14px;">
      This lead was submitted through your ${safeBusinessName} website powered by LocalBlue
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Powered by <a href="https://localblue.co" style="color: #2563eb; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <notifications@localblue.co>',
      to: data.businessEmail,
      subject: sanitizeHeaderValue(`New Lead: ${data.leadName} - ${data.businessName}`),
      html: emailHtml,
      replyTo: data.leadEmail,
    });

    console.log('Lead notification email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send lead notification email:', error);
    return false;
  }
}

interface ContactSalesData {
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  message?: string;
}

export async function sendContactSalesEmail(data: ContactSalesData): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const safeName = escapeHtml(data.name);
    const safeEmail = escapeHtml(data.email);
    const safePhone = data.phone ? escapeHtml(data.phone) : '';
    const safeBusinessName = escapeHtml(data.businessName);
    const safeMessage = data.message ? escapeHtml(data.message) : 'No message provided';
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Scale Plan Inquiry</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Scale Plan Inquiry</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Someone wants to learn about custom implementation</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 18px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">Contact Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 120px; color: #64748b; font-weight: 500;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="mailto:${safeEmail}" style="color: #7c3aed; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        ${safePhone ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="tel:${safePhone}" style="color: #7c3aed; text-decoration: none;">${safePhone}</a>
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Business</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${safeBusinessName}</td>
        </tr>
      </table>
      
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">Message</h3>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed;">
          <p style="margin: 0; color: #475569; white-space: pre-wrap;">${safeMessage}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <a href="mailto:${safeEmail}?subject=Re: LocalBlue Scale Plan Inquiry" 
         style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Reply to ${safeName}
      </a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">LocalBlue Scale Plan Inquiry</p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <sales@localblue.co>',
      to: 'colton@futurebuild.ai',
      subject: sanitizeHeaderValue(`Scale Plan Inquiry: ${safeBusinessName} - ${safeName}`),
      html: emailHtml,
      replyTo: data.email,
    });

    console.log('Contact sales email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send contact sales email:', error);
    return false;
  }
}

interface WelcomeEmailData {
  businessName: string;
  businessEmail: string;
  subdomain: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const baseDomain = process.env.BASE_DOMAIN || "localblue.co";
    const siteUrl = `https://${data.subdomain}.${baseDomain}`;
    const adminUrl = `https://admin.${data.subdomain}.${baseDomain}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LocalBlue</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LocalBlue!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 16px 0 0; font-size: 18px;">Your professional website is ready</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin: 0 0 20px; font-size: 16px;">Hi there!</p>
      <p style="margin: 0 0 20px; font-size: 16px;">Congratulations on creating your new website for <strong>${data.businessName}</strong>. Your site is now live and ready to start generating leads!</p>
      
      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin: 0 0 16px; color: #1e293b;">Your Website Details</h3>
        <p style="margin: 0 0 12px;">
          <strong>Site URL:</strong> 
          <a href="${siteUrl}" style="color: #2563eb;">${siteUrl}</a>
        </p>
        <p style="margin: 0;">
          <strong>Admin Panel:</strong> 
          <a href="${adminUrl}" style="color: #2563eb;">${adminUrl}</a>
        </p>
      </div>
      
      <h3 style="margin: 24px 0 16px; color: #1e293b;">Next Steps</h3>
      <ol style="margin: 0; padding-left: 24px; color: #475569;">
        <li style="margin-bottom: 12px;">Preview your website and make any final adjustments</li>
        <li style="margin-bottom: 12px;">Connect your custom domain (optional)</li>
        <li style="margin-bottom: 12px;">Publish your site to go live</li>
        <li>Start receiving leads from potential customers!</li>
      </ol>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <a href="${adminUrl}" 
         style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Open Admin Panel
      </a>
    </div>
    
    <p style="margin: 24px 0 0; text-align: center; color: #94a3b8; font-size: 14px;">
      Need help? Reply to this email and we'll be happy to assist.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Powered by <a href="https://localblue.co" style="color: #2563eb; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <hello@localblue.co>',
      to: data.businessEmail,
      subject: sanitizeHeaderValue(`Your ${data.businessName} website is ready!`),
      html: emailHtml,
    });

    console.log('Welcome email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

interface BetaFeedbackData {
  name?: string;
  email: string;
  message: string;
}

export async function sendBetaFeedbackEmail(data: BetaFeedbackData): Promise<boolean> {
  try {
    const { client, fromEmail } = getResendClient();
    
    const safeName = data.name ? escapeHtml(data.name) : 'Anonymous';
    const safeEmail = escapeHtml(data.email);
    const safeMessage = escapeHtml(data.message);
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Beta Feedback</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Beta Feedback</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Someone shared feedback about LocalBlue</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="background: white; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Feedback Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 120px; color: #64748b; font-weight: 500;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 500;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <a href="mailto:${safeEmail}" style="color: #10b981; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
      </table>
      
      <div style="margin-top: 24px;">
        <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">Message</h3>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #475569; white-space: pre-wrap;">${safeMessage}</p>
        </div>
      </div>
    </div>
    
    <div style="margin-top: 24px; text-align: center;">
      <a href="mailto:${safeEmail}?subject=Re: Your beta feedback" 
         style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Reply to ${safeName}
      </a>
    </div>
    
    <p style="margin: 24px 0 0; text-align: center; color: #94a3b8; font-size: 14px;">
      This feedback was submitted through the LocalBlue beta program
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">Powered by <a href="https://localblue.co" style="color: #10b981; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <feedback@localblue.co>',
      to: 'grant@futurebuild.ai',
      subject: sanitizeHeaderValue(`Beta Feedback: ${data.name || 'Anonymous'}`),
      html: emailHtml,
      replyTo: data.email,
    });

    console.log('Beta feedback email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send beta feedback email:', error);
    return false;
  }
}

interface OutreachEmailData {
  fromBusinessName: string;
  fromEmail: string;
  recipientEmail: string;
  recipientName: string;
  recipientCompany?: string;
  subject: string;
  body: string;
}

export async function sendOutreachEmail(data: OutreachEmailData): Promise<boolean> {
  if (!EMAIL_REGEX.test(data.recipientEmail)) {
    console.error('Invalid recipient email format:', data.recipientEmail);
    return false;
  }

  try {
    const { client, fromEmail } = getResendClient();

    const safeBody = escapeHtml(data.body).replace(/\n/g, '<br>');
    const safeBusinessName = escapeHtml(data.fromBusinessName);
    const safeRecipientName = escapeHtml(data.recipientName);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="padding: 20px 0;">
    <p style="margin: 0 0 16px;">Hi ${safeRecipientName},</p>
    <div style="margin: 0 0 24px; color: #374151;">${safeBody}</div>
    <p style="margin: 0; color: #374151;">Best regards,<br><strong>${safeBusinessName}</strong></p>
  </div>
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; text-align: center; color: #9ca3af; font-size: 11px;">
    <p style="margin: 0;">Sent via <a href="https://localblue.co" style="color: #2563eb; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <outreach@localblue.co>',
      to: data.recipientEmail,
      subject: sanitizeHeaderValue(data.subject),
      html: emailHtml,
      replyTo: data.fromEmail,
    });

    console.log('Outreach email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send outreach email:', error);
    return false;
  }
}
