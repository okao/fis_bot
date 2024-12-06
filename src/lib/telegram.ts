export async function sendTelegramMessage(
	chatId: string,
	message: string
) {
	const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
	const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: message,
			parse_mode: 'HTML',
		}),
	});

	return response.json();
}
