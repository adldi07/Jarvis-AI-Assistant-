// src/utils/dateUtils.js
export const formatDate = (timestamp, options = { weekday: 'short', month: 'short', day: 'numeric' }) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, options);
};

export const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const isSameDay = (timestamp1, timestamp2) => {
    const date1 = new Date(timestamp1 * 1000);
    const date2 = new Date(timestamp2 * 1000);
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};