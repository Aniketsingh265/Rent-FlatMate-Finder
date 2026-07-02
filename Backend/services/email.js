const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Rent & Flatmate Finder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

// Notify owner when high-score tenant shows interest
const notifyOwnerOfInterest = async (owner, tenant, listing, score) => {
  await sendEmail({
    to: owner.email,
    subject: ` New Interest: ${tenant.name} wants your listing!`,
    html: `
      <h2>New Interest in Your Listing</h2>
      <p><strong>${tenant.name}</strong> has expressed interest in your listing: <strong>${listing.title}</strong></p>
      <p>Compatibility Score: <strong>${score}/100</strong></p>
      <p>Login to accept or decline their request.</p>
    `,
  });
};

// Notify tenant when owner accepts their interest
const notifyTenantAccepted = async (tenant, listing) => {
  await sendEmail({
    to: tenant.email,
    subject: ` Your interest was accepted!`,
    html: `
      <h2>Great News!</h2>
      <p>The owner of <strong>${listing.title}</strong> has accepted your interest.</p>
      <p>You can now chat with them directly. Login to start the conversation!</p>
    `,
  });
};

// Notify tenant when owner declines their interest
const notifyTenantDeclined = async (tenant, listing) => {
  await sendEmail({
    to: tenant.email,
    subject: `Interest update for ${listing.title}`,
    html: `
      <h2>Interest Update</h2>
      <p>Unfortunately, the owner of <strong>${listing.title}</strong> has declined your interest.</p>
      <p>Don't worry — keep browsing other listings!</p>
    `,
  });
};

module.exports = { sendEmail, notifyOwnerOfInterest, notifyTenantAccepted, notifyTenantDeclined };