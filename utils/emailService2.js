// emailService.js
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL2,
    pass: process.env.PASS2,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to send email');
  }
});

// Wrap sendMail in a Promise
const sendMail = (emailData, emailAddresses) => {
  return new Promise((resolve, reject) => {
    try {
      const mailOptions = {
        from: `"Neoteric IT" <${process.env.EMAIL}>`,
        bcc: emailAddresses.join(', '), // Join email addresses with a comma
        replyTo: 'admin@neotericit.com',
        subject: emailData?.subject || 'From NeotericIT Test',
        html: `${emailData?.message}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log('Email sent: ' + info.response);
          resolve(info.response);
        }
      });
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};

module.exports = {
  sendMail,
};
