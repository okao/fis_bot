import { useEffect, useState } from 'react';

interface TelegramUser {
	id: number;
	first_name: string;
	username?: string;
}

interface TelegramWebApp {
	initData: string;
	initDataUnsafe: {
		query_id: string;
		user: TelegramUser;
		chat_instance?: string;
		chat?: {
			id: number;
			type: string;
		};
		auth_date: string;
		hash: string;
	};
	ready: () => void;
	expand: () => void;
	MainButton: {
		show: () => void;
		hide: () => void;
	};
}

declare global {
	interface Window {
		Telegram?: {
			WebApp: TelegramWebApp;
		};
	}
}

export function useTelegram() {
	const [user, setUser] = useState<TelegramUser | null>(null);
	const [chatId, setChatId] = useState<string | null>(null);
	const [isInTelegram, setIsInTelegram] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const webApp = window.Telegram?.WebApp;

			if (webApp) {
				// Initialize Telegram WebApp
				webApp.ready();
				webApp.expand();

				console.log('Telegram WebApp Debug:', {
					webAppExists: !!webApp,
					initData: webApp.initData,
					initDataUnsafe: webApp.initDataUnsafe,
					user: webApp.initDataUnsafe?.user,
					chat: webApp.initDataUnsafe?.chat,
					window:
						typeof window !== 'undefined' ? 'exists' : 'undefined',
					telegram: !!window.Telegram,
				});

				if (webApp.initDataUnsafe?.user) {
					console.log(
						'Setting Telegram User:',
						webApp.initDataUnsafe.user
					);
					setUser(webApp.initDataUnsafe.user);
					setIsInTelegram(true);
					setChatId(
						webApp.initDataUnsafe.chat?.id?.toString() ||
							webApp.initDataUnsafe.user.id.toString()
					);
				}
			}
		}
	}, []);

	return {
		user,
		chatId,
		isInTelegram,
	};
}
