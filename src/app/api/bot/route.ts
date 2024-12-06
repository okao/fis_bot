export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

import { Bot, webhookCallback } from 'grammy';
import { KeyboardButton } from 'grammy/types';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token)
	throw new Error(
		'TELEGRAM_BOT_TOKEN environment variable not found.'
	);

const bot = new Bot(token);

// Define the web app URL - replace with your actual web app URL
// const webAppUrl = 'https://fis.oala.dev/search';
const webAppUrl = `${process.env.NEXT_PUBLIC_URL}/search`;

bot.command('search', async (ctx) => {
	const keyboard = {
		keyboard: [
			[
				{
					text: '🔍 Open Search',
					web_app: { url: webAppUrl },
				} as KeyboardButton,
			],
		],
		resize_keyboard: true,
	};

	await ctx.reply('Click the button below to open search:', {
		reply_markup: keyboard,
	});
});

// Keep the echo functionality for other messages
bot.on('message:text', async (ctx) => {
	if (!ctx.message.text.startsWith('/')) {
		await ctx.reply(ctx.message.text);
	}
});

export const POST = webhookCallback(bot, 'std/http');
