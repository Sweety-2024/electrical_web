const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const nodemailer = require("nodemailer");
const fs = require("fs/promises");

require("dotenv").config();

const app = express();

/* =========================
   PORT
========================= */

const PORT = process.env.PORT || 3000;

/* =========================
   SUPPLIER EMAIL
========================= */

const SUPPLIER_EMAIL =
  process.env.SUPPLIER_EMAIL || "a3527725@gmail.com";

const INQUIRIES_FILE = path.join(__dirname, "submissions.json");

const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();
const smtpLooksConfigured =
  smtpUser &&
  smtpPass &&
  !/your|password|app_password|placeholder/i.test(smtpUser) &&
  !/your|password|app_password|placeholder/i.test(smtpPass);

/* =========================
   ALLOWED ORIGINS
========================= */

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/* =========================
   MIDDLEWARE
========================= */

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed by CORS"));
      }
    }
  })
);

app.use(express.static(path.join(__dirname)));

/* =========================
   VALIDATION
========================= */

const phoneRegex = /^[6-9]\d{9}$/;

const emailRegex = /^\S+@\S+\.\S+$/;

function validatePayload(payload) {
  const errors = {};

  if (!payload.name || !payload.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!phoneRegex.test((payload.phone || "").trim())) {
    errors.phone = "Please enter valid 10 digit mobile number.";
  }

  if (!payload.email || !emailRegex.test(payload.email.trim())) {
    errors.email = "Please enter valid email address.";
  }

  if (!payload.inquiry || !payload.inquiry.trim()) {
    errors.inquiry = "Please select inquiry type.";
  }

  if (!payload.product || !payload.product.trim()) {
    errors.product = "Please enter product name.";
  }

  if (!payload.message || payload.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  return errors;
}

/* =========================
   SMTP CONFIG
========================= */

const transporter = smtpLooksConfigured
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
  : null;

async function saveInquiryLocally(inquiry) {
  let entries = [];

  try {
    const existing = await fs.readFile(INQUIRIES_FILE, "utf8");
    const parsed = JSON.parse(existing);
    entries = Array.isArray(parsed) ? parsed : [parsed];
  } catch (_error) {
    entries = [];
  }

  entries.push(inquiry);

  await fs.writeFile(INQUIRIES_FILE, JSON.stringify(entries, null, 2));
}

/* =========================
   VERIFY SMTP
========================= */

if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.log("FULL SMTP ERROR =>");
      console.log(error);
    } else {
      console.log("SMTP CONNECTED SUCCESSFULLY");
    }
  });
} else {
  console.log("SMTP is not configured with a valid Gmail App Password yet. Inquiry submissions will be saved locally.");
}

/* =========================
   HEALTH API
========================= */

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server running successfully"
  });
});

/* =========================
   CONTACT API
========================= */

app.post("/api/contact", async (req, res) => {
  const payload = {
    name: (req.body.name || "").trim(),
    phone: (req.body.phone || "").trim(),
    email: (req.body.email || "").trim(),
    inquiry: (req.body.inquiry || "").trim(),
    product: (req.body.product || "").trim(),
    message: (req.body.message || "").trim()
  };

  const errors = validatePayload(payload);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please enter valid details.",
      errors
    });
  }

  const submissionRecord = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  let adminMail = null;
  let clientMail = null;
  let warning = null;

  try {
    console.log("NEW INQUIRY RECEIVED");

    if (transporter) {
      try {
        adminMail = await transporter.sendMail({
        from: `"Shivaay Traders" <${process.env.SMTP_USER}>`,
        to: SUPPLIER_EMAIL,
        replyTo: payload.email,
        subject: `New Inquiry - ${payload.product}`,
        text: [
          "New Inquiry Received",
          "",
          `Name: ${payload.name}`,
          `Phone: ${payload.phone}`,
          `Email: ${payload.email}`,
          `Inquiry Type: ${payload.inquiry}`,
          `Product: ${payload.product}`,
          "",
          "Message:",
          payload.message
        ].join("\n")
        });

        console.log("ADMIN EMAIL SENT:", adminMail.messageId);
      } catch (adminError) {
        warning =
          "SMTP is unavailable right now, so your inquiry was saved locally and will be emailed after SMTP is fixed.";
        console.log("ADMIN EMAIL FAILED =>");
        console.log(adminError);
      }
    } else {
      warning =
        "SMTP is unavailable right now, so your inquiry was saved locally and will be emailed after SMTP is fixed.";
      console.log("ADMIN EMAIL SKIPPED: SMTP not configured");
    }

    if (transporter) {
      try {
        clientMail = await transporter.sendMail({
        from: `"Shivaay Traders" <${process.env.SMTP_USER}>`,
        to: payload.email,
        subject: "We Received Your Inquiry - Shivaay Traders",
        text: [
          `Dear ${payload.name},`,
          "",
          "Thank you for contacting Shivaay Traders.",
          "",
          "We received your inquiry successfully.",
          "",
          "Details:",
          `Inquiry Type: ${payload.inquiry}`,
          `Product: ${payload.product}`,
          "",
          "Message:",
          payload.message,
          "",
          "Our team will contact you shortly.",
          "",
          "Regards,",
          "Shivaay Traders",
          "Phone: +91 9871203212"
        ].join("\n")
        });

        console.log("CLIENT EMAIL SENT:", clientMail.messageId);
      } catch (clientError) {
        warning =
          warning ||
          "SMTP is unavailable right now, so your inquiry was saved locally and the confirmation email could not be sent.";
        console.log("CLIENT EMAIL FAILED =>");
        console.log(clientError);
      }
    } else {
      warning =
        warning ||
        "SMTP is unavailable right now, so your inquiry was saved locally and the confirmation email could not be sent.";
      console.log("CLIENT EMAIL SKIPPED: SMTP not configured");
    }

    if (!adminMail || !clientMail) {
      await saveInquiryLocally(submissionRecord);
      console.log("INQUIRY SAVED LOCALLY:", submissionRecord.createdAt);
    }

    return res.status(200).json({
      success: true,
      message:
        adminMail && clientMail
          ? "Inquiry sent successfully."
          : "Inquiry received successfully.",
      warning,
      adminMessageId: adminMail ? adminMail.messageId : null,
      clientMessageId: clientMail ? clientMail.messageId : null
    });
  } catch (error) {
    console.log("FULL EMAIL ERROR =>");
    console.log(error);

    try {
      await saveInquiryLocally({
        ...submissionRecord,
        saveReason: error.message
      });
    } catch (saveError) {
      console.log("LOCAL SAVE ERROR =>");
      console.log(saveError);
    }

    return res.status(200).json({
      success: true,
      message: "Inquiry received successfully.",
      warning:
        "Inquiry could not be emailed right now, but it was saved locally.",
      errorMessage: error.message,
      errorCode: error.code,
      response: error.response,
      responseCode: error.responseCode
    });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});