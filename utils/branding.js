const config = require('../config');

const getEmbedColor = (type = 'default') => {
    // NUMB SYSTEM color scheme - dark theme
    const colors = {
        'success': '#00FF00',  // Bright Green
        'error': '#FF0000',    // Red
        'warning': '#FFA500',  // Orange
        'info': '#000000',     // Black (NUMB SYSTEM signature)
        'default': '#000000'   // Black
    };
    
    const customColor = config.branding.embedColor;
    return colors[type] || customColor || '#000000';
};

const getServerName = () => {
    return config.branding.serverName || 'NUMB SYSTEM Server';
};

const getBotName = () => {
    return config.branding.botName || 'NUMB SYSTEM';
};

const getBranding = () => {
    return {
        name: getBotName(),
        serverName: getServerName(),
        color: config.branding.embedColor || '#000000',
        footer: config.branding.footer || `NUMB SYSTEM v2.0 • By MrSmith`,
        timestamp: true,
        developer: config.branding.developer
    };
};

module.exports = { getEmbedColor, getServerName, getBotName, getBranding };