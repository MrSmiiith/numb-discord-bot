# 🚀 NUMB SYSTEM - Deployment Guide

## Quick Start

### 1️⃣ **Clone & Install**
```bash
git clone https://github.com/MrSmiiith/numb-discord-bot.git
cd numb-discord-bot
npm install
```

### 2️⃣ **Configure**
```bash
# Copy example config
cp config.example.js config.js

# Edit config.js with your values
```

### 3️⃣ **Discord Setup**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to Bot section
4. Copy Token
5. Enable all Intents
6. Generate invite link with Administrator permission

### 4️⃣ **Launch**
```bash
npm start
```

## 📋 Configuration Checklist

- [ ] Bot token added to config.js
- [ ] Client ID added
- [ ] Guild ID added
- [ ] All channel IDs configured
- [ ] All role IDs configured
- [ ] Bot invited to server
- [ ] Bot has Administrator permission

## 🔧 Required Discord Setup

### Channels Needed:
- **Logs**: general, voice, message, moderation, tickets
- **Verification**: admin-alert, dashboard, 4 voice channels
- **Tickets**: category for tickets, transcripts channel
- **Confessions**: confession channel

### Roles Needed:
- **Staff**: Admin, Moderator
- **Verification**: Unverified, Verified
- **Gender**: Boy, Girl (optional)
- **Moderation**: Muted

## 🎮 First Time Setup Commands

After bot is online:
1. `/setup dashboard` - Setup verification dashboard
2. `/ticket setup` - Create ticket panel
3. `/reactionroles create` - Setup reaction roles
4. `/confess setup` - Setup confession system

## 🔴 Troubleshooting

### Bot not coming online?
- Check token is correct
- Verify all intents are enabled
- Check console for errors

### Commands not showing?
- Wait 5 minutes for Discord to update
- Restart bot
- Check bot has proper permissions

### Database errors?
- Ensure /database folder exists
- Check write permissions
- Delete .sqlite files to reset

## 📦 Project Structure
```
numb-discord-bot/
├── commands/          # All bot commands
├── events/           # Discord event handlers
├── utils/            # Utility functions
│   └── analytics/    # Analytics system
├── database/         # SQLite databases
├── backups/         # Server backups
├── config.js        # Your configuration
└── index.js         # Main bot file
```

## 🌐 Hosting Options

### Local/VPS
```bash
# Use PM2 for production
npm install -g pm2
pm2 start index.js --name "numb-discord-bot"
pm2 save
pm2 startup
```

### Heroku
```bash
# Add Procfile
echo "worker: node index.js" > Procfile
git add .
git commit -m "Add Procfile"
heroku create your-app-name
git push heroku main
```

### Railway/Render
- Connect GitHub repo
- Set start command: `node index.js`
- Add environment variables

## 🔐 Security Notes

- **Never** commit config.js with real token
- Use environment variables for production
- Regularly update dependencies
- Monitor bot usage

## 📞 Support

- **Developer**: MrSmith
- **Website**: https://merzougrayane.com
- **GitHub**: https://github.com/MrSmiiith
- **Email**: contact@merzougrayane.com

---

**NUMB SYSTEM** - Feel Nothing. Control Everything.