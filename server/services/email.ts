import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
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

export async function sendLeadNotification(data: LeadNotificationData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
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
    <p style="margin: 0;">Powered by <a href="https://localblue" style="color: #2563eb; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <notifications@localblue>',
      to: data.businessEmail,
      subject: `New Lead: ${data.leadName} - ${data.businessName}`,
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

interface WelcomeEmailData {
  businessName: string;
  businessEmail: string;
  subdomain: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const siteUrl = `https://${data.subdomain}.localblue`;
    const adminUrl = `https://admin.${data.subdomain}.localblue`;
    
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
    <p style="margin: 0;">Powered by <a href="https://localblue" style="color: #2563eb; text-decoration: none;">LocalBlue</a></p>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'LocalBlue <hello@localblue>',
      to: data.businessEmail,
      subject: `Your ${data.businessName} website is ready!`,
      html: emailHtml,
    });

    console.log('Welcome email sent:', result);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
