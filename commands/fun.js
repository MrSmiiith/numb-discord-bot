const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEmbedColor, getServerName } = require('../utils/branding');

const facts = [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible!",
    "A group of flamingos is called a 'flamboyance'.",
    "Bananas are berries, but strawberries aren't.",
    "The shortest war in history lasted only 38-45 minutes.",
    "Octopuses have three hearts and blue blood.",
    "The Great Wall of China isn't visible from space without aid.",
    "A day on Venus is longer than a year on Venus.",
    "The human brain uses about 20% of the body's total energy.",
    "Sharks have been around longer than trees.",
    "The Moon is moving away from Earth at about 1.5 inches per year.",
    "There are more possible games of chess than atoms in the observable universe.",
    "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
    "The inventor of the Pringles can is buried in one.",
    "A cloud can weigh more than a million pounds.",
    "Your body contains about 37.2 trillion cells.",
    "The longest word you can type using only your left hand is 'stewardesses'.",
    "Wombat poop is cube-shaped.",
    "The Eiffel Tower can grow up to 6 inches taller in summer due to thermal expansion.",
    "Antarctica is the world's largest desert.",
    "A shrimp's heart is in its head."
];

const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "Why don't eggs tell jokes? They'd crack up!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why did the math book look so sad? Because it had too many problems!",
    "What do you call a fake noodle? An impasta!",
    "Why did the coffee file a police report? It got mugged!",
    "How do you organize a space party? You planet!",
    "Why did the bicycle fall over? It was two-tired!",
    "What do you call a bear in the rain? A drizzly bear!",
    "Why can't a leopard hide? Because it's always spotted!",
    "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
    "Why did the cookie go to the doctor? Because it felt crumbly!",
    "What do you call a belt made of watches? A waist of time!",
    "Why did the tomato turn red? Because it saw the salad dressing!",
    "What do you call a snowman with a six-pack? An abdominal snowman!",
    "Why don't skeletons fight each other? They don't have the guts!",
    "What did the grape say when it got stepped on? Nothing, it just let out a little wine!",
    "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
    "What do you call a can opener that doesn't work? A can't opener!"
];
const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "In the middle of difficulty lies opportunity. - Albert Einstein",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "It does not matter how slowly you go as long as you do not stop. - Confucius",
    "Everything you've ever wanted is on the other side of fear. - George Addair",
    "Believe you can and you're halfway there. - Theodore Roosevelt",
    "The only impossible thing is that which is not attempted. - Spanish Proverb",
    "Life is 10% what happens to you and 90% how you react to it. - Charles R. Swindoll",
    "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "You miss 100% of the shots you don't take. - Wayne Gretzky",
    "Whether you think you can or you think you can't, you're right. - Henry Ford",
    "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('Fun commands for entertainment')
        .addSubcommand(subcommand =>
            subcommand
                .setName('fact')
                .setDescription('Get a random fun fact'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('joke')
                .setDescription('Get a random joke'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('quote')
                .setDescription('Get an inspirational quote'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('wouldyourather')
                .setDescription('Get a Would You Rather question'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('truthordare')
                .setDescription('Get a Truth or Dare challenge')
                .addStringOption(option =>
                    option.setName('choice')
                        .setDescription('Choose Truth or Dare')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Truth', value: 'truth' },
                            { name: 'Dare', value: 'dare' }
                        ))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch(subcommand) {
            case 'fact':
                await this.sendFact(interaction);
                break;
            case 'joke':
                await this.sendJoke(interaction);
                break;
            case 'quote':
                await this.sendQuote(interaction);
                break;
            case 'wouldyourather':
                await this.sendWouldYouRather(interaction);
                break;
            case 'truthordare':
                await this.sendTruthOrDare(interaction);
                break;
        }
    },

    async sendFact(interaction) {
        const fact = facts[Math.floor(Math.random() * facts.length)];

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('🧠 Fun Fact')
            .setDescription(fact)
            .setFooter({ text: `${getServerName()} • Did you know?` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async sendJoke(interaction) {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('success'))
            .setTitle('😄 Random Joke')
            .setDescription(joke)
            .setFooter({ text: `${getServerName()} • Hope you laughed!` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async sendQuote(interaction) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('info'))
            .setTitle('💭 Inspirational Quote')
            .setDescription(`*"${quote}"*`)
            .setFooter({ text: `${getServerName()} • Stay motivated!` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
    async sendWouldYouRather(interaction) {
        const questions = [
            "Would you rather be able to fly or be invisible?",
            "Would you rather have the ability to read minds or teleport?",
            "Would you rather live in the past or the future?",
            "Would you rather be incredibly rich but alone, or poor but surrounded by loved ones?",
            "Would you rather never use social media again or never watch TV/movies again?",
            "Would you rather be able to speak all languages or play all instruments?",
            "Would you rather have unlimited pizza for life or unlimited tacos for life?",
            "Would you rather always be 10 minutes late or 20 minutes early?",
            "Would you rather fight one horse-sized duck or 100 duck-sized horses?",
            "Would you rather have no internet or no air conditioning?",
            "Would you rather be able to control fire or water?",
            "Would you rather never age physically or mentally?",
            "Would you rather live without music or without movies?",
            "Would you rather always say everything on your mind or never speak again?",
            "Would you rather be able to breathe underwater or fly?",
            "Would you rather have a rewind button or a pause button for your life?",
            "Would you rather be famous but always alone or unknown but have great friends?",
            "Would you rather live in space or under the sea?",
            "Would you rather never eat your favorite food again or only eat your favorite food?",
            "Would you rather have super strength or super speed?"
        ];

        const question = questions[Math.floor(Math.random() * questions.length)];

        const embed = new EmbedBuilder()
            .setColor(getEmbedColor('warning'))
            .setTitle('🤔 Would You Rather...')
            .setDescription(question)
            .setFooter({ text: `${getServerName()} • Make your choice!` })
            .setTimestamp();

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('1️⃣');
        await message.react('2️⃣');
    },
    async sendTruthOrDare(interaction) {
        const choice = interaction.options.getString('choice');

        const truths = [
            "What's your biggest fear?",
            "What's the most embarrassing thing you've ever done?",
            "What's your biggest secret?",
            "Have you ever lied to your best friend?",
            "What's the strangest dream you've ever had?",
            "What's something you've never told anyone?",
            "What's your most embarrassing moment in school?",
            "Have you ever cheated on a test?",
            "What's the worst thing you've ever said to someone?",
            "What's your biggest regret?",
            "What's the most childish thing you still do?",
            "Have you ever broken the law?",
            "What's your worst habit?",
            "What's the most trouble you've ever been in?",
            "What's your guilty pleasure?"
        ];

        const dares = [
            "Send a message using only emojis for the next 5 minutes",
            "Change your nickname to 'I lost at Truth or Dare' for an hour",
            "Post the last photo in your camera roll (if appropriate)",
            "Speak in rhymes for the next 3 messages",
            "Use a celebrity's name in every message for 10 minutes",
            "Type with your eyes closed for your next message",
            "Send a compliment to the person above you",
            "Share your most used emoji",
            "Describe yourself using only food items",
            "Send a voice message singing Happy Birthday",
            "Type your next 3 messages backwards",
            "Use no vowels in your next 5 messages",
            "Speak like a pirate for 10 minutes",
            "End every message with 'in my opinion' for 15 minutes",
            "Only use CAPS LOCK for the next 10 messages"
        ];

        const content = choice === 'truth'
            ? truths[Math.floor(Math.random() * truths.length)]
            : dares[Math.floor(Math.random() * dares.length)];

        const embed = new EmbedBuilder()
            .setColor(choice === 'truth' ? getEmbedColor('info') : getEmbedColor('warning'))
            .setTitle(choice === 'truth' ? '🤐 Truth' : '🎯 Dare')
            .setDescription(content)
            .addFields({ name: 'Player', value: interaction.user.toString(), inline: true })
            .setFooter({ text: `${getServerName()} • ${choice === 'truth' ? 'Answer honestly!' : 'Complete your dare!'}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};