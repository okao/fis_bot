'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Bell, BellRing } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTelegram } from '@/lib/hooks/useTelegram';
import { motion, AnimatePresence } from 'framer-motion';

interface Flight {
	flightNo: string;
	airlineName: string;
	route1: string;
	route2: string | null;
	route3: string | null;
	scheduled: string;
	estimated: string | null;
	status: string | null;
	gate: string | null;
	carrierType: string | null;
	hasAlert?: boolean;
	date: string;
}

// Add animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: {
		opacity: 1,
		y: 0,
		transition: {
			type: 'spring',
			stiffness: 300,
			damping: 24,
		},
	},
};

export default function SearchPage() {
	const { user, chatId, isInTelegram } = useTelegram();
	const [query, setQuery] = useState('');
	const [date, setDate] = useState(format(new Date(), 'yyyyMMdd'));
	const [flights, setFlights] = useState<{
		arrivals: Flight[];
		departures: Flight[];
	}>({ arrivals: [], departures: [] });
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		console.log('Search Page Telegram Context:', {
			isInTelegram,
			user,
			chatId,
			userExists: !!user,
			firstName: user?.first_name,
		});
	}, [isInTelegram, user, chatId]);

	useEffect(() => {
		const searchFlights = async () => {
			setLoading(true);
			try {
				const queryParams = new URLSearchParams({
					q: query,
					date: date,
					...(isInTelegram && user?.id
						? { userId: user.id.toString() }
						: {}),
				});

				console.log('Searching with params:', {
					query,
					date,
					userId: user?.id,
					isInTelegram,
				});

				const res = await fetch(`/api/search?${queryParams}`);
				const data = await res.json();
				setFlights(data);
			} catch (error) {
				console.error('Search failed:', error);
			}
			setLoading(false);
		};

		const debounce = setTimeout(searchFlights, 300);
		return () => clearTimeout(debounce);
	}, [query, date, user?.id, isInTelegram]);

	const handleDateChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		try {
			const inputDate = new Date(e.target.value);
			if (isNaN(inputDate.getTime())) {
				setDate(format(new Date(), 'yyyyMMdd'));
			} else {
				setDate(format(inputDate, 'yyyyMMdd'));
			}
		} catch {
			setDate(format(new Date(), 'yyyyMMdd'));
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
		>
			<div className="container mx-auto px-4 py-8">
				<AnimatePresence>
					{isInTelegram && user && (
						<motion.div
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100"
						>
							<p className="text-blue-800">
								👋 Welcome{' '}
								<span className="font-medium">{user.first_name}</span>
								! Set alerts for flights you want to track.
							</p>
						</motion.div>
					)}
				</AnimatePresence>

				<div className="mb-8">
					<h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
						<span className="text-blue-600 mr-2">✈</span>
						Flight Information
					</h1>
					<div className="grid gap-4 md:grid-cols-2">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by flight number, airline, or route..."
							className="w-full p-3 rounded-md border border-gray-200
                                     bg-white text-gray-800 placeholder-gray-400
                                     focus:ring-2 focus:ring-blue-100 focus:border-blue-500
                                     outline-none transition-all"
						/>
						<input
							type="date"
							value={format(
								new Date(
									parseInt(date.substring(0, 4)),
									parseInt(date.substring(4, 6)) - 1,
									parseInt(date.substring(6, 8))
								),
								'yyyy-MM-dd'
							)}
							onChange={handleDateChange}
							className="w-full p-3 rounded-md border border-gray-200
                                     bg-white text-gray-800
                                     focus:ring-2 focus:ring-blue-100 focus:border-blue-500
                                     outline-none transition-all"
						/>
					</div>
				</div>

				{loading ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex justify-center items-center h-64"
					>
						<motion.div
							animate={{ rotate: 360 }}
							transition={{
								repeat: Infinity,
								duration: 1,
								ease: 'linear',
							}}
							className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"
						/>
					</motion.div>
				) : (
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate="show"
					>
						<motion.div variants={itemVariants}>
							<h2 className="text-lg font-medium text-gray-800 mb-4">
								<span className="text-green-600 mr-2">🛬</span>{' '}
								Arrivals
							</h2>
							<div className="space-y-3">
								{flights.arrivals.length === 0 ? (
									<p className="text-gray-500 text-center py-8 bg-blue-50/50 rounded-lg border border-blue-100">
										No arrival flights found
									</p>
								) : (
									flights.arrivals.map((flight) => (
										<FlightCard
											key={`${flight.flightNo}_${date}`}
											flight={flight}
											type="arrival"
											setFlights={setFlights}
										/>
									))
								)}
							</div>
						</motion.div>
						<motion.div variants={itemVariants}>
							<h2 className="text-lg font-medium text-gray-800 mb-4">
								<span className="text-blue-600 mr-2">🛫</span>{' '}
								Departures
							</h2>
							<div className="space-y-3">
								{flights.departures.length === 0 ? (
									<p className="text-gray-500 text-center py-8 bg-blue-50/50 rounded-lg border border-blue-100">
										No departure flights found
									</p>
								) : (
									flights.departures.map((flight) => (
										<FlightCard
											key={`${flight.flightNo}_${date}`}
											flight={flight}
											type="departure"
											setFlights={setFlights}
										/>
									))
								)}
							</div>
						</motion.div>
					</motion.div>
				)}
			</div>
		</motion.div>
	);
}

function FlightCard({
	flight,
	type,
	setFlights,
}: {
	flight: Flight;
	type: 'arrival' | 'departure';
	setFlights: React.Dispatch<
		React.SetStateAction<{
			arrivals: Flight[];
			departures: Flight[];
		}>
	>;
}) {
	const { user, chatId, isInTelegram } = useTelegram();
	const [isAlertSet, setIsAlertSet] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		console.log('Flight Alert Status:', {
			flightNo: flight.flightNo,
			hasAlert: flight.hasAlert,
			isAlertSet,
		});
	}, [flight.hasAlert, isAlertSet, flight.flightNo]);

	useEffect(() => {
		if (flight.hasAlert !== undefined) {
			setIsAlertSet(flight.hasAlert);
		}
	}, [flight.hasAlert]);

	const toggleAlert = async () => {
		if (!isInTelegram || !user || !chatId) {
			toast.error('Please open this page in Telegram');
			return;
		}

		setIsUpdating(true);
		try {
			const response = await fetch('/api/alerts', {
				method: isAlertSet ? 'DELETE' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					flightNo: flight.flightNo,
					date: flight.date,
					userId: user.id.toString(),
					chatId: chatId,
					username: user.username,
					firstName: user.first_name,
				}),
			});

			if (response.ok) {
				const queryParams = new URLSearchParams({
					q: '',
					date: flight.date,
					userId: user.id.toString(),
				});
				const searchRes = await fetch(`/api/search?${queryParams}`);
				const data = await searchRes.json();
				setFlights(data);

				setIsAlertSet(!isAlertSet);
				toast.success(
					isAlertSet
						? 'Alert removed successfully'
						: 'Alert set successfully'
				);
			}
		} catch (error) {
			console.error('Error toggling alert:', error);
			toast.error('Failed to update alert');
		}
		setIsUpdating(false);
	};

	const getStatusText = (status: string | null) => {
		if (!status) return 'Scheduled';

		const statusMap: Record<string, string> = {
			DP: 'Departed',
			DE: 'Departed',
			GZ: 'Gate Closed',
			AR: 'Arrived',
			CK: 'Checked-in',
			DL: 'Delayed',
			BD: 'Boarding',
			CN: 'Cancelled',
			ON: 'On-time',
			FT: 'In-flight',
			LX: 'Landing',
			LA: 'Landed',
		};

		return statusMap[status] || status;
	};

	const getStatusColor = (status: string | null) => {
		if (!status) return 'text-blue-600 bg-blue-50 border-blue-100';

		switch (status) {
			case 'DP':
			case 'DE':
			case 'AR':
			case 'LA':
				return 'text-green-600 bg-green-50 border-green-100';
			case 'DL':
				return 'text-amber-600 bg-amber-50 border-amber-100';
			case 'CN':
				return 'text-red-600 bg-red-50 border-red-100';
			case 'BD':
			case 'CK':
			case 'GZ':
				return 'text-blue-600 bg-blue-50 border-blue-100';
			case 'FT':
			case 'LX':
				return 'text-indigo-600 bg-indigo-50 border-indigo-100';
			default:
				return 'text-gray-600 bg-gray-50 border-gray-100';
		}
	};

	const getCarrierTypeLabel = (type: string | null) => {
		switch (type) {
			case 'I':
				return {
					text: 'International',
					color: 'text-purple-600 bg-purple-50 border-purple-100',
				};
			case 'D':
				return {
					text: 'Domestic',
					color: 'text-teal-600 bg-teal-50 border-teal-100',
				};
			default:
				return null;
		}
	};

	const carrierType = getCarrierTypeLabel(flight.carrierType);

	const getRoutes = () => {
		const routes = [
			flight.route1,
			flight.route2,
			flight.route3,
		].filter(Boolean);
		return routes.join(' → ');
	};

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			whileHover={{ y: -2 }}
			className={`p-4 border rounded-lg shadow-sm transition-all ${
				isAlertSet
					? 'bg-emerald-50/50 border-emerald-200 hover:shadow-emerald-100'
					: 'bg-white border-gray-100 hover:shadow-md'
			}`}
		>
			<div className="flex justify-between items-start">
				<div className="flex-1">
					<div className="flex items-start gap-3">
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<div className="font-medium text-gray-800">
									{flight.flightNo}
								</div>
								{isInTelegram && (
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={toggleAlert}
										disabled={isUpdating}
										className={`p-1.5 rounded-full transition-all ${
											isUpdating
												? 'opacity-50 cursor-not-allowed'
												: isAlertSet
												? 'hover:bg-emerald-100'
												: 'hover:bg-gray-100'
										}`}
										title={isAlertSet ? 'Remove alert' : 'Set alert'}
									>
										{isAlertSet ? (
											<BellRing
												className="w-4 h-4 text-emerald-500"
												aria-label="Alert is set"
											/>
										) : (
											<Bell
												className="w-4 h-4 text-gray-400"
												aria-label="Set alert"
											/>
										)}
									</motion.button>
								)}
							</div>
							<div className="text-sm text-gray-500 mt-0.5">
								{flight.airlineName}
							</div>
						</div>
						{carrierType && (
							<span
								className={`px-2 py-0.5 text-xs rounded-full border ${carrierType.color} whitespace-nowrap self-center`}
							>
								{carrierType.text}
							</span>
						)}
					</div>
				</div>

				<div className="flex-1 text-right">
					<div className="text-gray-800 font-medium">
						{type === 'arrival' ? 'From' : 'To'}: {getRoutes()}
					</div>
					<div className="text-sm text-gray-500 mt-1">
						<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
							Gate: {flight.gate || 'TBA'}
						</span>
					</div>
				</div>
			</div>

			<div className="mt-3 flex justify-between items-center text-sm border-t border-gray-100 pt-3">
				<div className="space-y-1">
					<div className="text-gray-600 flex items-center gap-2">
						<span className="text-gray-400">Scheduled:</span>
						<span className="font-medium">{flight.scheduled}</span>
					</div>
					{flight.estimated && (
						<div className="text-gray-600 flex items-center gap-2">
							<span className="text-gray-400">Estimated:</span>
							<span className="font-medium">{flight.estimated}</span>
						</div>
					)}
				</div>
				<div>
					<span
						className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
							flight.status
						)} font-medium`}
					>
						{getStatusText(flight.status)}
					</span>
				</div>
			</div>
		</motion.div>
	);
}
