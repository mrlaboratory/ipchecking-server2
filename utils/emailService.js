// emailService.js
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
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
const sendMail = (emailData, emailAddress) => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: `"Neoteric IT" <${process.env.EMAIL}>`,
      to: emailAddress,
      replyTo: 'admin@neotericit.com',
      subject: emailData?.subject || 'From NeotericIT Test',
      html: `${emailData?.message} 
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    });
  });
};

module.exports = {
  sendMail,
};
