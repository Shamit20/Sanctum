const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to Local MongoDB 🟢'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- NODEMAILER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, 
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    zenScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Registration OTP Schema
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});
const OTP = mongoose.model('OTP', otpSchema);

// Password Reset OTP Schema
const resetOtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});
const ResetOTP = mongoose.model('ResetOTP', resetOtpSchema);

const chatSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true }, 
    sessionId: { type: String, index: true }, 
    sessionName: { type: String, default: "New Chat" }, 
    role: String,
    iv: String, 
    content: String, 
    facialEmotion: { type: String, default: "neutral" },
    timestamp: { type: Date, default: Date.now, index: true } 
});
// Private Journal Schema
const journalSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true }, 
    iv: String, 
    content: String, 
    timestamp: { type: Date, default: Date.now, index: true } 
});
const Journal = mongoose.model('Journal', journalSchema);
const Chat = mongoose.model('Chat', chatSchema);

// --- ZERO-KNOWLEDGE ENCRYPTION ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 
const ALGORITHM = 'aes-256-cbc';

const encrypt = (text) => {
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (ivHex, encryptedHex) => {
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        return "[Message could not be decrypted]";
    }
};

const checkSafety = (text) => {
    const crisisKeywords = ["kill myself", "suicide", "end it all", "want to die", "hurt myself", "cutting myself"];
    return crisisKeywords.some(keyword => text.toLowerCase().includes(keyword));
};

// ==========================================
// SECURE AUTHENTICATION ROUTES
// ==========================================

// 1. REGISTRATION - STEP 1 (Generate OTP)
app.post('/api/auth/register-step1', async (req, res) => {
    try {
        const { username, email } = req.body;

        const usernameRegex = /^[a-zA-Z0-9_@.-]+$/;
        if (!usernameRegex.test(username)) return res.status(400).json({ error: "Invalid characters in username." });

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).json({ error: "Username or Email already exists." });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otpCode, salt);

        await OTP.deleteMany({ email }); 
        await new OTP({ email, otpHash, expiresAt: Date.now() + 10 * 60 * 1000 }).save();

        await transporter.sendMail({
            from: `"Sanctum Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Sanctum: Secure Verification Code",
            text: `Your Sanctum verification code is: ${otpCode}. It will expire in 10 minutes.`
        });

        res.json({ success: true, message: "A 6-digit code has been sent to your email." });
    } catch (error) {
        res.status(500).json({ error: "Failed to send verification code." });
    }
});

// 2. REGISTRATION - STEP 2 (Verify OTP & Create Account)
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { username, email, password, otp } = req.body;

        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) return res.status(400).json({ error: "No pending verification found." });
        if (Date.now() > otpRecord.expiresAt) return res.status(400).json({ error: "OTP expired. Please try again." });

        const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isMatch) return res.status(400).json({ error: "Invalid OTP code." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        await OTP.deleteMany({ email }); 

        res.json({ success: true, userId: newUser._id, username: newUser.username });
    } catch (error) {
        res.status(500).json({ error: "Verification failed." });
    }
});

// 3. LOGIN (Supports Username OR Email via $or query)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; 
        
        const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        res.json({ success: true, userId: user._id, username: user.username });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

// 4. FORGOT PASSWORD - STEP 1 (Generate OTP)
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        res.json({ success: true, message: "If an account with that email exists, a 6-digit recovery code has been sent." });

        if (user) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            const otpHash = await bcrypt.hash(otpCode, salt);

            await ResetOTP.deleteMany({ email });
            await new ResetOTP({ email, otpHash, expiresAt: Date.now() + 10 * 60 * 1000 }).save();
            
            await transporter.sendMail({
                from: `"Sanctum Security" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Sanctum: Password Recovery",
                text: `A password reset was requested.\n\nYour Username is: ${user.username}\nYour 6-digit Reset Code is: ${otpCode}\n\nIf you did not request this, ignore this email. This code expires in 10 minutes.`
            });
        }
    } catch (error) {
        console.error(error);
    }
});

// 5. FORGOT PASSWORD - STEP 2 (Verify OTP & Reset)
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!newPassword || newPassword.trim().length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }

        const otpRecord = await ResetOTP.findOne({ email });
        if (!otpRecord) return res.status(400).json({ error: "Invalid or expired reset code." });
        if (Date.now() > otpRecord.expiresAt) return res.status(400).json({ error: "Reset code has expired." });

        const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isMatch) return res.status(400).json({ error: "Invalid code." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        await ResetOTP.deleteMany({ email }); 
        res.json({ success: true, message: "Password updated successfully! You can now log in." });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset password." });
    }
});

// 6. DELETE ACCOUNT
app.delete('/api/auth/account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await Chat.deleteMany({ userId: userId });
        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: "Account deleted." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete account" });
    }
});

// ==========================================
// CHAT ROUTES
// ==========================================
app.get('/api/sessions', async (req, res) => {
    try {
        const { userId } = req.query; 
        if (!userId || userId === "guest") return res.json([]); 

        const sessions = await Chat.aggregate([
            { $match: { userId: userId } }, 
            { $group: { _id: "$sessionId", lastMessage: { $max: "$timestamp" }, name: { $last: "$sessionName" } } },
            { $sort: { lastMessage: -1 } } 
        ]);
        res.json(sessions.map(s => ({ id: s._id, name: s.name || "New Chat" })));
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve sessions" });
    }
});

app.put('/api/sessions/:sessionId', async (req, res) => {
    try {
        const { name } = req.body;
        await Chat.updateMany({ sessionId: req.params.sessionId }, { $set: { sessionName: name } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to rename session" });
    }
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
    try {
        await Chat.deleteMany({ sessionId: req.params.sessionId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete session" });
    }
});

app.get('/api/history/:sessionId', async (req, res) => {
    try {
        const history = await Chat.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 }).limit(50); 
        const decryptedHistory = history.map(doc => ({
            sender: doc.role,
            text: decrypt(doc.iv, doc.content),
            facialEmotion: doc.facialEmotion, 
            isSafe: true, 
            timestamp: doc.timestamp
        }));
        res.json(decryptedHistory);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve history" });
    }
});

app.post('/api/chat', async (req, res) => {
    const { message, isIncognito, sessionId = "default-session", sessionName = "New Chat", userId, facialEmotion } = req.body;

    if (!message || !userId) return res.status(400).json({ error: "Message and userId are required" });

    if (checkSafety(message)) {
        return res.json({
            reply: "I hear how much pain you are in right now... Please reach out to them:\n🔴 **iCall Helpline:** 9152987821\n🔴 **Emergency:** 112",
            isSafe: false
        });
    }

    const shouldSave = !isIncognito && userId !== "guest";

    try {
        // SAVE USER MESSAGE FIRST
        if (shouldSave) {
            const encryptedUserMsg = encrypt(message);
            await new Chat({
                userId, sessionId, sessionName, role: 'user', iv: encryptedUserMsg.iv, content: encryptedUserMsg.encryptedData, facialEmotion: facialEmotion || "neutral"
            }).save();
        }

        // --- THE EMPATHETIC COMPANION PROMPT ---
        let systemPrompt = `You are Sanctum, a highly empathetic, non-judgmental mental health companion. Your goal is to listen, validate the user's feelings, and provide emotional comfort. DO NOT act like a doctor. DO NOT rush to give advice or try to 'solve' the user's problem. Ask gentle, open-ended questions to encourage the user to express their feelings.`;

        // Append facial emotion data if it exists
        let currentContent = message;
        if (facialEmotion && facialEmotion !== "neutral") {
             currentContent = `[Note: The user's face appears to be expressing ${facialEmotion}]. User says: "${message}"`;
        }

        // --- NEW: FETCH RECENT HISTORY FOR AI MEMORY ---
        let historyContext = [];
        if (shouldSave) {
            // Fetch the last 8 messages for context (so we don't blow up the local RAM)
            const recentHistory = await Chat.find({ sessionId }).sort({ timestamp: -1 }).limit(8);
            recentHistory.reverse(); // Put them back in chronological order
            
            // Map them into the format the LLM expects
            historyContext = recentHistory.map(doc => ({
                role: doc.role === 'ai' ? 'assistant' : 'user',
                content: decrypt(doc.iv, doc.content)
            }));
        }
        // ----------------------------------------------

        const aiResponse = await axios.post(
            process.env.AI_SERVICE_URL, 
            {
                model: process.env.AI_MODEL_NAME,
                messages: [
                    { role: "system", content: systemPrompt }, 
                    ...historyContext,  // <-- INJECTING THE MEMORY HERE!
                    { role: "user", content: currentContent }
                ],
                max_tokens: 250,
                temperature: 0.6,
                frequency_penalty: 0.7,
                presence_penalty: 0.5,
                stream: false, 
                stop: ["<|eot_id|>", "Therapist:", "doctor", "helpline"] 
            },
            { timeout: 300000 }
        );

        const botReply = aiResponse.data.choices[0].message.content.trim();

        // SAVE THE AI REPLY
        if (shouldSave) {
            const encryptedAiMsg = encrypt(botReply);
            await new Chat({
                userId, sessionId, sessionName, role: 'ai', iv: encryptedAiMsg.iv, content: encryptedAiMsg.encryptedData, facialEmotion: "neutral"
            }).save();
        }

        res.json({ reply: botReply, isSafe: true });
    } catch (error) {
        res.status(500).json({ reply: "I am having trouble connecting to the AI.", error: error.message });
    }
});
// ==========================================
// JOURNAL ROUTES
// ==========================================
app.post('/api/journal', async (req, res) => {
    try {
        const { userId, text } = req.body;
        if (!userId || !text) return res.status(400).json({ error: "Missing data" });
        
        const encrypted = encrypt(text);
        const entry = new Journal({ userId, iv: encrypted.iv, content: encrypted.encryptedData });
        await entry.save();
        
        res.json({ success: true, entry: { id: entry._id, text, timestamp: entry.timestamp } });
    } catch (err) { res.status(500).json({ error: "Failed to save journal" }); }
});

app.get('/api/journal/:userId', async (req, res) => {
    try {
        const entries = await Journal.find({ userId: req.params.userId }).sort({ timestamp: -1 });
        const decrypted = entries.map(doc => ({
            id: doc._id,
            text: decrypt(doc.iv, doc.content),
            timestamp: doc.timestamp
        }));
        res.json(decrypted);
    } catch (err) { res.status(500).json({ error: "Failed to load journal" }); }
});
// ==========================================
// ZEN SCORE ROUTES
// ==========================================
app.get('/api/users/:id/zenscore', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json({ zenScore: user ? user.zenScore : 0 });
    } catch (err) { res.status(500).json({ error: "Failed to fetch score" }); }
});

app.put('/api/users/:id/zenscore', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { zenScore: req.body.score });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to update score" }); }
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));