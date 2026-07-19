const nodemailer = require('nodemailer');
const path = require('path');

exports.sendContactEmail = async (req, res) => {
  const { email, message, name, phone, targetEmail } = req.body;

  if (!email || !message) {
    return res.status(400).json({ message: 'El correo y el mensaje son obligatorios.' });
  }

  try {
    // Usamos SIEMPRE la cuenta de Gmail válida para ENVIAR (el "cartero")
    const senderUser = process.env.SMTP_USER;
    const senderPass = process.env.SMTP_PASS;

    // Configura el transportador de nodemailer para aceptar cualquier servidor (Gmail o DonWeb)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: process.env.SMTP_PORT == 465, // true para 465, false para 587
      auth: {
        user: senderUser,
        pass: senderPass,
      },
    });

    // Pero el DESTINO del correo sí es el que pidió el frontend (ventas o jvpowerled)
    const destination = targetEmail || senderUser;

    let phoneHtml = '<strong>No especificado</strong>';
    if (phone) {
      let cleanPhone = phone.replace(/\D/g, '');
      // Format to start with 549 for Argentina
      if (cleanPhone.length === 10) {
        cleanPhone = `549${cleanPhone}`;
      } else if (cleanPhone.startsWith('54') && cleanPhone.length === 12) {
        cleanPhone = `549${cleanPhone.slice(2)}`;
      } else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        cleanPhone = `549${cleanPhone.slice(1)}`;
      }
      const waLink = `https://wa.me/${cleanPhone}`;
      phoneHtml = `<a href="${waLink}" target="_blank" style="color: #25D366; text-decoration: none; font-weight: 600;">${phone}`;
    }

    const mailOptions = {
      from: `"SEMAFOROS LED" <${senderUser}>`,
      to: destination, // A dónde llegará el correo
      replyTo: email, // Para que al darle "Responder" le llegue al cliente
      subject: `Nuevo mensaje de contacto web de ${name || email}`,
      text: `Has recibido un nuevo mensaje de contacto desde la web.\n\nNombre: ${name || 'No especificado'}\nCorreo del cliente: ${email}\nTeléfono: ${phone || 'No especificado'}\nBuzón de destino: ${destination}\n\nMensaje:\n${message}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <title>Nuevo Mensaje de Contacto</title>
        <style>
          body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding: 40px 0; }
          .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; }
          .header { background-color: #0f172a; padding: 35px 40px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px; }
          .header h1 span { color: #3b82f6; }
          .header p { color: #94a3b8; margin: 10px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; }
          .content { padding: 40px; color: #334155; }
          .greeting { font-size: 18px; margin: 0 0 15px 0; font-weight: 600; color: #0f172a; }
          .intro { font-size: 15px; line-height: 1.6; margin: 0 0 30px 0; color: #475569; }
          .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 25px; margin-bottom: 35px; }
          .details-row { margin: 0 0 12px 0; font-size: 15px; color: #334155; }
          .details-row:last-child { margin: 0; }
          .details-label { font-weight: 600; color: #64748b; display: inline-block; width: 100px; }
          .message-title { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 12px 0; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .message-body { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 25px; font-size: 15px; line-height: 1.7; color: #334155; white-space: pre-wrap; }
          .action-container { text-align: center; margin-top: 35px; margin-bottom: 10px; }
          .btn { background-color: #3b82f6; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid #3b82f6; }
          .footer { background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { color: #64748b; margin: 0 0 8px 0; font-size: 13px; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
        </head>
        <body>
          <center class="wrapper">
            <!-- Preheader oculto para la vista previa del correo -->
            <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; mso-hide: all;">
              Nueva consulta web de ${name || 'un cliente'}. Revisa los detalles del mensaje.
            </div>
            
            <table class="main" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="header">
                  <img src="cid:logo" alt="Semáforos Led" width="200" style="max-width: 200px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
                  <h1>SEMAFOROS<span>LED</span></h1>
                  <p>Portal de Consultas Corporativas</p>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <p class="greeting">Hola, equipo de Semáforos Led:</p>
                  <p class="intro">Se ha registrado una nueva consulta a través del formulario oficial de la tienda. A continuación se detallan los datos del cliente y su requerimiento.</p>
                  
                  <div class="details-box">
                    <p class="details-row"><span class="details-label">Fecha:</span> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p class="details-row"><span class="details-label">Cliente:</span> <strong>${name || 'No especificado'}</strong></p>
                    <p class="details-row"><span class="details-label">Teléfono:</span> ${phoneHtml}</p>
                    <p class="details-row" style="margin: 0;"><span class="details-label">Correo:</span> <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">${email}</a></p>
                  </div>

                  <h4 class="message-title">Mensaje del Cliente</h4>
                  <div class="message-body">${message.replace(/\n/g, '<br>')}</div>
                  
                  <div class="action-container">
                    <a href="mailto:${email}" class="btn">Responder Consulta ➔</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>&copy; ${new Date().getFullYear()} <strong>Semaforos Led</strong>. Todos los derechos reservados.</p>
                  <p>Este es un documento confidencial y automatizado emitido por <a href="https://semaforosled.com.ar">https://semaforosled.com.ar</a>.</p>
                </td>
              </tr>
            </table>
          </center>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'logo.jpg',
          path: path.join(__dirname, '../assets/logo.jpg'),
          cid: 'logo'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Correo enviado exitosamente' });
  } catch (error) {
    console.error('Error al enviar correo:', error);
    res.status(500).json({ message: 'Hubo un error al enviar el correo. Por favor intenta más tarde.' });
  }
};
