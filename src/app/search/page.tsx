'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Flight {
	flightNo: string;
	airlineName: string;
	route1: string;
	scheduled: string;
	estimated: string | null;
	status: string | null;
	gate: string | null;
}

export default function SearchPage() {
	const [query, setQuery] = useState('');
	const [date, setDate] = useState(format(new Date(), 'yyyyMMdd'));
	const [flights, setFlights] = useState<{
		arrivals: Flight[];
		departures: Flight[];
	}>({ arrivals: [], departures: [] });
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const searchFlights = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/search?q=${query}&date=${date}`
				);
				const data = await res.json();
				setFlights(data);
			} catch (error) {
				console.error('Search failed:', error);
			}
			setLoading(false);
		};

		const debounce = setTimeout(searchFlights, 300);
		return () => clearTimeout(debounce);
	}, [query, date]);

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
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8 space-y-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Flight Search
					</h1>
					<div className="grid gap-4 md:grid-cols-2">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by flight number, airline, or route..."
							className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                     focus:border-transparent outline-none transition-all"
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
							className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                     focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                                     focus:border-transparent outline-none transition-all"
						/>
					</div>
				</div>

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
							<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
								<span className="mr-2">🛬</span> Arrivals
							</h2>
							<div className="space-y-4">
								{flights.arrivals.length === 0 ? (
									<p className="text-gray-500 dark:text-gray-400 text-center py-8">
										No arrival flights found
									</p>
								) : (
									flights.arrivals.map((flight) => (
										<FlightCard
											key={`${flight.flightNo}_${date}`}
											flight={flight}
											type="arrival"
										/>
									))
								)}
							</div>
						</div>
						<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
							<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
								<span className="mr-2">🛫</span> Departures
							</h2>
							<div className="space-y-4">
								{flights.departures.length === 0 ? (
									<p className="text-gray-500 dark:text-gray-400 text-center py-8">
										No departure flights found
									</p>
								) : (
									flights.departures.map((flight) => (
										<FlightCard
											key={`${flight.flightNo}_${date}`}
											flight={flight}
											type="departure"
										/>
									))
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function FlightCard({
	flight,
	type,
}: {
	flight: Flight;
	type: 'arrival' | 'departure';
}) {
	const getStatusColor = (status: string | null) => {
		switch (status?.toLowerCase()) {
			case 'landed':
				return 'text-green-600 dark:text-green-400';
			case 'departed':
				return 'text-green-600 dark:text-green-400';
			case 'delayed':
				return 'text-amber-600 dark:text-amber-400';
			case 'cancelled':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-blue-600 dark:text-blue-400';
		}
	};

	return (
		<div
			className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg
                      bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50
                      transition-all"
		>
			<div className="flex justify-between">
				<div>
					<div className="font-bold text-gray-900 dark:text-white">
						{flight.flightNo}
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-400">
						{flight.airlineName}
					</div>
				</div>
				<div className="text-right">
					<div className="text-gray-900 dark:text-white">
						{type === 'arrival' ? 'From' : 'To'}: {flight.route1}
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-400">
						Gate: {flight.gate || 'TBA'}
					</div>
				</div>
			</div>
			<div className="mt-3 flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
				<div>
					<div className="text-gray-600 dark:text-gray-400">
						Scheduled: {flight.scheduled}
					</div>
					{flight.estimated && (
						<div className="text-gray-600 dark:text-gray-400">
							Estimated: {flight.estimated}
						</div>
					)}
				</div>
				<div className="text-right">
					<div
						className={`font-medium ${getStatusColor(flight.status)}`}
					>
						{flight.status || 'Scheduled'}
					</div>
				</div>
			</div>
		</div>
	);
}
