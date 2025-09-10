import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface AlertEmailData {
  to: string;
  userName: string;
  alertName: string;
  flightData: any;
  triggerType: 'price_drop' | 'new_deal' | 'availability';
}

interface WelcomeEmailData {
  to: string;
  userName: string;
}

interface PasswordResetData {
  to: string;
  userName: string;
  resetToken: string;
  resetUrl: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured = false;

  constructor() {
    this.setupTransporter();
  }

  // Configurar transportador de email
  private setupTransporter(): void {
    try {
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      };

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn(
          'Credenciais de email não configuradas. Serviço de email desabilitado.'
        );
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;

      // Verificar conexão
      this.transporter.verify(error => {
        if (error) {
          logger.error('Erro na configuração do email:', error);
          this.isConfigured = false;
        } else {
          logger.info('Serviço de email configurado com sucesso');
        }
      });
    } catch (error) {
      logger.error('Erro ao configurar transportador de email:', error);
      this.isConfigured = false;
    }
  }

  // Enviar email de alerta de voo
  async sendAlertEmail(data: AlertEmailData): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Serviço de email não configurado. Email não enviado.');
      return false;
    }

    try {
      const subject = this.generateAlertSubject(
        data.triggerType,
        data.flightData
      );
      const html = this.generateAlertEmailHTML(data);

      const mailOptions = {
        from: `"FlightExec" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email de alerta enviado para ${data.to}`);
      return true;
    } catch (error) {
      logger.error('Erro ao enviar email de alerta:', error);
      return false;
    }
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Serviço de email não configurado. Email não enviado.');
      return false;
    }

    try {
      const subject = 'Bem-vindo ao FlightExec! ✈️';
      const html = this.generateWelcomeEmailHTML(data);

      const mailOptions = {
        from: `"FlightExec" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email de boas-vindas enviado para ${data.to}`);
      return true;
    } catch (error) {
      logger.error('Erro ao enviar email de boas-vindas:', error);
      return false;
    }
  }

  // Enviar email de redefinição de senha
  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Serviço de email não configurado. Email não enviado.');
      return false;
    }

    try {
      const subject = 'Redefinição de Senha - FlightExec';
      const html = this.generatePasswordResetEmailHTML(data);

      const mailOptions = {
        from: `"FlightExec" <${process.env.SMTP_USER}>`,
        to: data.to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email de redefinição de senha enviado para ${data.to}`);
      return true;
    } catch (error) {
      logger.error('Erro ao enviar email de redefinição de senha:', error);
      return false;
    }
  }

  // Gerar assunto do email de alerta
  private generateAlertSubject(triggerType: string, flightData: any): string {
    const route = `${flightData.origin} → ${flightData.destination}`;

    switch (triggerType) {
      case 'price_drop':
        return `💰 Preço Reduzido: ${route} - FlightExec`;
      case 'new_deal':
        return `🔥 Promoção Imperdível: ${route} - FlightExec`;
      case 'availability':
        return `⚡ Últimas Vagas: ${route} - FlightExec`;
      default:
        return `✈️ Voo Encontrado: ${route} - FlightExec`;
    }
  }

  // Gerar HTML do email de alerta
  private generateAlertEmailHTML(data: AlertEmailData): string {
    const flight = data.flightData;
    const price = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: flight.currency || 'BRL',
    }).format(flight.price);

    const departureDate = new Date(flight.departureTime).toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const departureTime = new Date(flight.departureTime).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

    const duration = `${Math.floor(flight.duration / 60)}h${flight.duration % 60}m`;
    const stops =
      flight.stops === 0 ? 'Voo direto' : `${flight.stops} parada(s)`;

    let alertIcon = '✈️';
    let alertMessage = 'Encontramos um voo que corresponde ao seu alerta!';

    switch (data.triggerType) {
      case 'price_drop':
        alertIcon = '💰';
        alertMessage = 'Ótima notícia! O preço do seu voo favorito caiu!';
        break;
      case 'new_deal':
        alertIcon = '🔥';
        alertMessage = 'Promoção imperdível encontrada!';
        break;
      case 'availability':
        alertIcon = '⚡';
        alertMessage = 'Atenção! Restam poucas vagas disponíveis!';
        break;
    }

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Alerta de Voo - FlightExec</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .flight-card { border: 2px solid #e1e8ed; border-radius: 12px; padding: 20px; margin: 20px 0; background-color: #f8fafc; }
            .route { font-size: 24px; font-weight: bold; color: #2d3748; margin-bottom: 10px; }
            .price { font-size: 32px; font-weight: bold; color: #38a169; margin: 15px 0; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .detail-item { padding: 10px; background-color: white; border-radius: 8px; border-left: 4px solid #667eea; }
            .detail-label { font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; }
            .detail-value { font-size: 16px; color: #2d3748; font-weight: 500; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
            .alert-badge { display: inline-block; background-color: #fed7d7; color: #c53030; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${alertIcon} FlightExec</h1>
                <p>Seu assistente inteligente para voos executivos</p>
            </div>
            
            <div class="content">
                <div class="alert-badge">
                    Alerta: ${data.alertName}
                </div>
                
                <h2>Olá, ${data.userName}!</h2>
                <p>${alertMessage}</p>
                
                <div class="flight-card">
                    <div class="route">
                        ${flight.origin} → ${flight.destination}
                    </div>
                    
                    <div class="price">${price}</div>
                    
                    <p><strong>${flight.airline} ${flight.flightNumber}</strong> - Classe Executiva</p>
                    
                    <div class="details">
                        <div class="detail-item">
                            <div class="detail-label">Data de Partida</div>
                            <div class="detail-value">${departureDate}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Horário</div>
                            <div class="detail-value">${departureTime}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Duração</div>
                            <div class="detail-value">${duration}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Paradas</div>
                            <div class="detail-value">${stops}</div>
                        </div>
                    </div>
                    
                    ${flight.availableSeats <= 5 ? `<p style="color: #e53e3e; font-weight: bold; margin-top: 15px;">⚠️ Apenas ${flight.availableSeats} vagas restantes!</p>` : ''}
                </div>
                
                <a href="${process.env.FRONTEND_URL}/flights/${flight.id}" class="cta-button">
                    Ver Detalhes e Reservar
                </a>
                
                <p style="color: #718096; font-size: 14px; margin-top: 30px;">
                    Este alerta foi gerado automaticamente com base nas suas preferências. 
                    Para gerenciar seus alertas, <a href="${process.env.FRONTEND_URL}/alerts">clique aqui</a>.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2024 FlightExec. Todos os direitos reservados.</p>
                <p>Você está recebendo este email porque configurou um alerta de voo.</p>
                <p><a href="${process.env.FRONTEND_URL}/unsubscribe">Cancelar inscrição</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Gerar HTML do email de boas-vindas
  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao FlightExec</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
            .content { padding: 40px; }
            .feature { display: flex; align-items: center; margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; }
            .feature-icon { font-size: 24px; margin-right: 15px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✈️ Bem-vindo ao FlightExec!</h1>
                <p>Sua jornada para voos executivos inteligentes começa agora</p>
            </div>
            
            <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                
                <p>Estamos muito felizes em tê-lo conosco! O FlightExec é sua ferramenta definitiva para encontrar as melhores ofertas em voos de classe executiva.</p>
                
                <h3>O que você pode fazer:</h3>
                
                <div class="feature">
                    <div class="feature-icon">🔍</div>
                    <div>
                        <strong>Busca Inteligente</strong><br>
                        Compare preços de múltiplas companhias aéreas em tempo real
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">🔔</div>
                    <div>
                        <strong>Alertas Personalizados</strong><br>
                        Receba notificações quando encontrarmos promoções nas suas rotas favoritas
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div>
                        <strong>Histórico de Preços</strong><br>
                        Veja tendências de preços para tomar a melhor decisão
                    </div>
                </div>
                
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <div>
                        <strong>Notificações em Tempo Real</strong><br>
                        Seja o primeiro a saber sobre ofertas limitadas
                    </div>
                </div>
                
                <a href="${process.env.FRONTEND_URL}/dashboard" class="cta-button">
                    Começar Agora
                </a>
                
                <p>Dica: Configure seu primeiro alerta para começar a receber notificações sobre as melhores ofertas!</p>
            </div>
            
            <div class="footer">
                <p>© 2024 FlightExec. Todos os direitos reservados.</p>
                <p>Precisa de ajuda? <a href="${process.env.FRONTEND_URL}/support">Entre em contato</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Gerar HTML do email de redefinição de senha
  private generatePasswordResetEmailHTML(data: PasswordResetData): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha - FlightExec</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .reset-box { background-color: #f8fafc; border: 2px solid #e1e8ed; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
            .warning { background-color: #fed7d7; color: #c53030; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 FlightExec</h1>
                <p>Redefinição de Senha</p>
            </div>
            
            <div class="content">
                <h2>Olá, ${data.userName}!</h2>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta FlightExec.</p>
                
                <div class="reset-box">
                    <h3>Redefinir Senha</h3>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <a href="${data.resetUrl}" class="cta-button">
                        Redefinir Minha Senha
                    </a>
                    <p style="font-size: 14px; color: #718096; margin-top: 20px;">
                        Este link expira em 1 hora por motivos de segurança.
                    </p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong> Se você não solicitou esta redefinição, ignore este email. 
                    Sua senha permanecerá inalterada.
                </div>
                
                <p style="font-size: 14px; color: #718096;">
                    Por motivos de segurança, não compartilhe este link com ninguém.
                </p>
            </div>
            
            <div class="footer">
                <p>© 2024 FlightExec. Todos os direitos reservados.</p>
                <p>Este é um email automático, não responda.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export const emailService = new EmailService();
export default emailService;
