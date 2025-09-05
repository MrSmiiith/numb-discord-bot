const chalk = require('chalk');
const boxen = require('boxen');

class ConsoleUI {
    constructor() {
        this.modules = new Map();
        this.startTime = Date.now();
    }

    displayBanner() {
        const banner = `
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███╗   ██╗██╗   ██╗███╗   ███╗██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗║
║   ████╗  ██║██║   ██║████╗ ████║██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║║
║   ██╔██╗ ██║██║   ██║██╔████╔██║██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║║
║   ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║║
║   ██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██████╔╝    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║║
║   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝║
║                                                                           ║
║                  ⚡ Advanced Discord Management System ⚡                  ║
║                                                                           ║
║                        Developed by MrSmith © 2024                       ║
║                       https://merzougrayane.com                          ║
║                       https://github.com/MrSmiiith                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
        `;
        
        console.clear();
        console.log(chalk.cyan(banner));
    }

    registerModule(name, status, icon) {
        this.modules.set(name, { status, icon, startTime: Date.now() });
        this.updateDisplay();
    }

    updateModule(name, status, icon) {
        if (this.modules.has(name)) {
            const module = this.modules.get(name);
            module.status = status;
            if (icon) module.icon = icon;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        console.log('\n' + chalk.cyan('═'.repeat(75)));
        console.log(chalk.white.bold('🔧 NUMB SYSTEM STATUS'));
        console.log(chalk.cyan('═'.repeat(75)));
        
        for (const [name, info] of this.modules) {
            const runtime = Math.round((Date.now() - info.startTime) / 1000);
            console.log(`${info.icon} ${chalk.white(name.padEnd(20))} ${chalk.gray('|')} ${this.getStatusColor(info.status)} ${chalk.gray(`(${runtime}s)`)}`);
        }
        console.log(chalk.cyan('═'.repeat(75)));
    }

    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'loading':
            case 'connecting':
            case 'initializing':
                return chalk.yellow(status);
            case 'connected':
            case 'loaded':
            case 'registered':
                return chalk.green(status);
            case 'error':
            case 'failed':
                return chalk.red(status);
            default:
                return chalk.gray(status);
        }
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const colors = {
            info: chalk.cyan,
            warn: chalk.yellow,
            error: chalk.red,
            success: chalk.green
        };
        
        const color = colors[level] || chalk.white;
        console.log(`${chalk.gray(timestamp)} ${color(`[${level.toUpperCase()}]`)} ${message}`);
    }
}

module.exports = ConsoleUI;