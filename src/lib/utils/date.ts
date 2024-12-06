export function getMaldivesTimestamp() {
	// Create timestamp in Maldives timezone (UTC+5)
	const now = new Date();
	const maldivesOffset = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
	return new Date(now.getTime() + maldivesOffset);
}
