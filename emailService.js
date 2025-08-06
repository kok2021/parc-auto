const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true pour 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Vérifier la connexion email
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Connexion email configurée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error);
    return false;
  }
};

// Email de bienvenue
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"AutoParc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Bienvenue chez AutoParc ! 🚗',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🚗 AutoParc</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Votre partenaire automobile de confiance</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1976d2; margin-bottom: 20px;">Bienvenue ${name} !</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Nous sommes ravis de vous accueillir dans la famille AutoParc. Votre compte a été créé avec succès.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">🎉 Ce que vous pouvez faire maintenant :</h3>
              <ul style="color: #333; line-height: 1.8;">
                <li>Parcourir notre catalogue de véhicules</li>
                <li>Demander des informations sur nos services</li>
                <li>Accéder à votre espace personnel</li>
                <li>Recevoir nos offres exclusives</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Accéder à AutoParc
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si vous avez des questions, n'hésitez pas à nous contacter à 
              <a href="mailto:contact@autoparc.fr" style="color: #1976d2;">contact@autoparc.fr</a>
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 AutoParc. Tous droits réservés.</p>
            <p style="margin: 5px 0 0 0;">123 Avenue des Champs-Élysées, 75008 Paris, France</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${email}`);
  } catch (error) {
    console.error('❌ Erreur envoi email de bienvenue:', error);
    throw error;
  }
};

// Email de réinitialisation de mot de passe
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"AutoParc" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - AutoParc',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔐 AutoParc</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1976d2; margin-bottom: 20px;">Bonjour ${name},</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte AutoParc.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="color: #333; margin-bottom: 20px;">
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
              </p>
              
              <a href="${resetUrl}" 
                 style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
              
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                Ce lien expirera dans 10 minutes pour des raisons de sécurité.
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">⚠️ Important :</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                <li>Ne partagez jamais ce lien avec quelqu'un d'autre</li>
                <li>Votre mot de passe actuel reste valide jusqu'à la réinitialisation</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${resetUrl}" style="color: #1976d2; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 AutoParc. Tous droits réservés.</p>
            <p style="margin: 5px 0 0 0;">123 Avenue des Champs-Élysées, 75008 Paris, France</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de réinitialisation envoyé à ${email}`);
  } catch (error) {
    console.error('❌ Erreur envoi email de réinitialisation:', error);
    throw error;
  }
};

// Notification de nouveau contact
const sendContactNotification = async (contact) => {
  try {
    const mailOptions = {
      from: `"AutoParc" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM, // Notification à l'équipe
      subject: `Nouveau contact - ${contact.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📧 AutoParc</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Nouveau message de contact</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1976d2; margin-bottom: 20px;">Nouveau contact reçu</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Nom :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Email :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.email}</td>
                </tr>
                ${contact.phone ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Téléphone :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.phone}</td>
                </tr>
                ` : ''}
                ${contact.company ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Entreprise :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.company}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Sujet :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Type :</td>
                  <td style="padding: 8px 0; color: #666;">${contact.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Date :</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(contact.createdAt).toLocaleString('fr-FR')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Message :</h3>
              <p style="color: #333; line-height: 1.6; margin: 0; white-space: pre-wrap;">${contact.message}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/contacts" 
                 style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Voir dans l'interface admin
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 AutoParc. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification de contact envoyée pour ${contact.name}`);
  } catch (error) {
    console.error('❌ Erreur envoi notification contact:', error);
    throw error;
  }
};

// Réponse à un contact
const sendContactResponse = async (contact, responseMessage) => {
  try {
    const mailOptions = {
      from: `"AutoParc" <${process.env.EMAIL_FROM}>`,
      to: contact.email,
      subject: `Réponse à votre demande - ${contact.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🚗 AutoParc</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Réponse à votre demande</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #1976d2; margin-bottom: 20px;">Bonjour ${contact.name},</h2>
            
            <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
              Nous vous remercions pour votre message concernant : <strong>${contact.subject}</strong>
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Notre réponse :</h3>
              <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${responseMessage}</div>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2e7d32; margin-top: 0;">📞 Besoin d'aide supplémentaire ?</h4>
              <p style="color: #2e7d32; margin-bottom: 10px;">
                N'hésitez pas à nous contacter :
              </p>
              <ul style="color: #2e7d32; margin: 0; padding-left: 20px;">
                <li>📧 Email : contact@autoparc.fr</li>
                <li>📱 Téléphone : +33 1 23 45 67 89</li>
                <li>📍 Adresse : 123 Avenue des Champs-Élysées, 75008 Paris</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: linear-gradient(90deg, #1976d2 0%, #43a047 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                Visiter notre site
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 AutoParc. Tous droits réservés.</p>
            <p style="margin: 5px 0 0 0;">123 Avenue des Champs-Élysées, 75008 Paris, France</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Réponse envoyée à ${contact.email}`);
  } catch (error) {
    console.error('❌ Erreur envoi réponse contact:', error);
    throw error;
  }
};

// Email de notification de maintenance
const sendMaintenanceNotification = async (vehicle, maintenanceData) => {
  try {
    const mailOptions = {
      from: `"AutoParc" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM,
      subject: `Maintenance programmée - ${vehicle.brand} ${vehicle.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #ffa000 0%, #f57c00 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔧 AutoParc</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Notification de maintenance</p>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #ffa000; margin-bottom: 20px;">Maintenance programmée</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #ffa000; margin-top: 0;">Véhicule : ${vehicle.brand} ${vehicle.model}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Type :</td>
                  <td style="padding: 8px 0; color: #666;">${maintenanceData.type}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Date :</td>
                  <td style="padding: 8px 0; color: #666;">${new Date(maintenanceData.date).toLocaleDateString('fr-FR')}</td>
                </tr>
                ${maintenanceData.garage ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Garage :</td>
                  <td style="padding: 8px 0; color: #666;">${maintenanceData.garage}</td>
                </tr>
                ` : ''}
                ${maintenanceData.cost ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #333;">Coût :</td>
                  <td style="padding: 8px 0; color: #666;">${maintenanceData.cost} FCFA</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${maintenanceData.description ? `
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #f57c00; margin-top: 0;">Description :</h4>
              <p style="color: #333; line-height: 1.6; margin: 0;">${maintenanceData.description}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© 2024 AutoParc. Tous droits réservés.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification de maintenance envoyée pour ${vehicle.brand} ${vehicle.model}`);
  } catch (error) {
    console.error('❌ Erreur envoi notification maintenance:', error);
    throw error;
  }
};

module.exports = {
  verifyEmailConnection,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendContactNotification,
  sendContactResponse,
  sendMaintenanceNotification
}; 