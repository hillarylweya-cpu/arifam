import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security & Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development with Vite
  }));
  app.use(cors());
  app.use(express.json());

  // Rate Limiting for Auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { error: "Too many attempts. Please try again later." }
  });

  // Mock Integration Store (In production, use a secure DB or Env Vars)
  // For this app, we'll use a simple in-memory store that Admins can update via API
  let integrations = {
    email: { provider: "", apiKey: "", smtpHost: "", smtpPort: "", user: "", pass: "" },
    sms: { provider: "twilio", accountSid: "", authToken: "", fromNumber: "" },
    weather: { apiKey: "" },
    maps: { apiKey: "" },
    market: { apiKey: "" }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get Integrations Status (Public info, no keys)
  app.get("/api/integrations/status", (req, res) => {
    res.json({
      email: !!(integrations.email.apiKey || (integrations.email.user && integrations.email.pass)),
      sms: !!(integrations.sms.accountSid && integrations.sms.authToken),
      weather: !!integrations.weather.apiKey,
      maps: !!integrations.maps.apiKey,
      market: !!integrations.market.apiKey
    });
  });

  // Update Integrations (Admin only - in a real app, verify Admin token)
  app.post("/api/integrations/update", (req, res) => {
    const { type, config } = req.body;
    if (integrations[type]) {
      integrations[type] = { ...integrations[type], ...config };
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid integration type" });
    }
  });

  // Send OTP
  app.post("/api/auth/send-otp", authLimiter, async (req, res) => {
    const { email, phone, code } = req.body;
    let emailSent = false;
    let smsSent = false;

    // Try Email
    if (email && (integrations.email.user || integrations.email.apiKey)) {
      try {
        const transporter = nodemailer.createTransport({
          host: integrations.email.smtpHost || "smtp.gmail.com",
          port: parseInt(integrations.email.smtpPort) || 587,
          secure: false,
          auth: {
            user: integrations.email.user,
            pass: integrations.email.pass
          }
        });

        await transporter.sendMail({
          from: '"AgriFarm" <no-reply@agrifarm.com>',
          to: email,
          subject: "Your AgriFarm Reset Code",
          text: `Your 6-digit reset code is: ${code}. It expires in 10 minutes.`,
          html: `<b>Your AgriFarm reset code is: <span style="font-size: 24px;">${code}</span></b><p>It expires in 10 minutes.</p>`
        });
        emailSent = true;
      } catch (err) {
        console.error("Email error:", err);
      }
    }

    // Try SMS
    if (phone && integrations.sms.accountSid && integrations.sms.authToken) {
      try {
        const client = twilio(integrations.sms.accountSid, integrations.sms.authToken);
        await client.messages.create({
          body: `AgriFarm: Your reset code is ${code}. Valid for 10 mins.`,
          from: integrations.sms.fromNumber,
          to: phone
        });
        smsSent = true;
      } catch (err) {
        console.error("SMS error:", err);
      }
    }

    if (!emailSent && !smsSent) {
      return res.status(500).json({ error: "Messaging not configured. Contact admin." });
    }

    res.json({ success: true, emailSent, smsSent });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
