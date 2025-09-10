import nodemailer from 'nodemailer';
import { logger } from './logger';

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Envia um email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<void> {
  try {
    const mailOptions = {
      from: from || process.env.SMTP_FROM || 'noreply@flightexec.com',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
    throw error;
  }
}

/**
 * Envia email de alerta de preço
 */
export async function sendPriceAlertEmail(
  to: string,
  origin: string,
  destination: string,
  currentPrice: number,
  targetPrice: number,
  priceChangePercent: number
): Promise<void> {
  const subject = `🎯 Alerta de Preço - ${origin} → ${destination}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Seu alerta de preço foi ativado!</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Rota:</strong> ${origin} → ${destination}</p>
        <p><strong>Preço atual:</strong> <span style="color: #27ae60; font-size: 18px;">R$ ${currentPrice.toFixed(2)}</span></p>
        <p><strong>Seu preço alvo:</strong> R$ ${targetPrice.toFixed(2)}</p>
        <p><strong>Variação:</strong> <span style="color: ${priceChangePercent < 0 ? '#27ae60' : '#e74c3c'}">${priceChangePercent.toFixed(1)}%</span></p>
      </div>
      
      ${
        currentPrice <= targetPrice
          ? `<div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>✅ Preço atingiu seu alvo!</strong>
        </div>`
          : `<div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>📉 Queda significativa no preço!</strong>
        </div>`
      }
      
      <p>Acesse o FlightExec para ver as melhores ofertas disponíveis e finalizar sua compra.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
           style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver Ofertas
        </a>
      </div>
    </div>
  `;

  await sendEmail(to, subject, html);
}

/**
 * Envia email de oferta especial
 */
export async function sendSpecialOfferEmail(
  to: string,
  origin: string,
  destination: string,
  price: number,
  discountPercent: number,
  airline: string
): Promise<void> {
  const subject = `🔥 Oferta Especial - ${origin} → ${destination}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">🔥 Oferta especial encontrada!</h2>
      
      <div style="background-color: #fff5f5; border: 2px solid #e74c3c; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Rota:</strong> ${origin} → ${destination}</p>
        <p><strong>Preço:</strong> <span style="color: #e74c3c; font-size: 24px; font-weight: bold;">R$ ${price.toFixed(2)}</span></p>
        <p><strong>Desconto:</strong> <span style="color: #27ae60; font-size: 18px;">${discountPercent}%</span></p>
        <p><strong>Companhia:</strong> ${airline}</p>
      </div>
      
      <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <strong>⏰ Oferta por tempo limitado!</strong>
      </div>
      
      <p>Esta é uma oferta especial com desconto significativo. Não perca esta oportunidade!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
           style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">
          Aproveitar Oferta
        </a>
      </div>
    </div>
  `;

  await sendEmail(to, subject, html);
}

export default {
  sendEmail,
  sendPriceAlertEmail,
  sendSpecialOfferEmail,
};
