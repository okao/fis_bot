export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token)
	throw new Error(
		'TELEGRAM_BOT_TOKEN environment variable not found.'
	);

const bot = new Bot(token);

// Define the web app URL
const webAppUrl = `${process.env.NEXT_PUBLIC_URL}/search`;

// Welcome message when user starts the bot
bot.command('start', async (ctx) => {
	await ctx.reply(
		'👋 Welcome to Flight Information System!\n\n' +
			'I can help you:\n' +
			'• Search for flights\n' +
			'• Set flight alerts\n' +
			'• Track flight status\n\n' +
			'Use /flights to start searching.',
		{
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: '✈️ Search Flights',
							web_app: { url: webAppUrl },
						},
					],
					[
						{
							text: '❓ Help',
							callback_data: 'help',
						},
					],
				],
			},
		}
	);
});

// Main flight search command
bot.command(['search', 'flights'], async (ctx) => {
	await ctx.reply(
		'🔍 <b>Flight Search</b>\n\n' +
			'Click below to:\n' +
			'• Search flights\n' +
			'• Set alerts\n' +
			'• Track status',
		{
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: '✈️ Open Flight Search',
							web_app: { url: webAppUrl },
						},
					],
				],
			},
		}
	);
});

// Help command
bot.command('help', async (ctx) => {
	await ctx.reply(
		'📖 <b>Available Commands</b>\n\n' +
			'/flights - Search flights and set alerts\n' +
			'/help - Show this help message\n\n' +
			'💡 <b>Tips:</b>\n' +
			'• Use the search to find specific flights\n' +
			'• Set alerts to get notified of changes\n' +
			'• Track multiple flights at once',
		{
			parse_mode: 'HTML',
		}
	);
});

// Handle help callback
bot.callbackQuery('help', async (ctx) => {
	await ctx.answerCallbackQuery();
	await ctx.reply(
		'📖 <b>Available Commands</b>\n\n' +
			'/flights - Search flights and set alerts\n' +
			'/help - Show this help message\n\n' +
			'💡 <b>Tips:</b>\n' +
			'• Use the search to find specific flights\n' +
			'• Set alerts to get notified of changes\n' +
			'• Track multiple flights at once',
		{
			parse_mode: 'HTML',
		}
	);
});

// Remove echo functionality
export const POST = webhookCallback(bot, 'std/http');
