/**## safeTimeout `utility function`
 * Use this function to safely set a timeout with a delay and avoid NodeJS.Timeout overflow.
 * 
 * Only necessary when the delay is greater than the maximum NodeJS.Timeout ms value (2.147.483.647 ms).
 * 
 * @param callback The function to call when the timeout is reached.
 * 
 * @param delay The delay in milliseconds.
 * 
 * @param timeout An object with the current timeout. It will be updated with the new timeout value every time the function is called.
 */
export function safeTimeout(callback: () => void, delay: number, timeout: {timeout: NodeJS.Timeout | null} = {timeout: null} ) {
    //const MAX_TIMEOUT = 2_147_483_647; //maximum timeout ms value for NodeJS.Timeout (32-bit signed integer)
    const MAX_TIMEOUT = 30000;
    if(timeout.timeout) clearTimeout(timeout.timeout);

    if (delay > MAX_TIMEOUT) {
        timeout.timeout = setTimeout(() => safeTimeout(callback, delay - MAX_TIMEOUT, timeout), MAX_TIMEOUT);
    } else {
        timeout.timeout = setTimeout(callback, delay);
    }
}

/**## parseDate `utility function`
 * Use this function to parse a date string in the format "dd/mm/yyyy hh:mm:ss".
 * 
 * @param dateString The date string to parse.
 * 
 * @returns The parsed date or null if invalid dateString.
 */
export function parseDate(dateString: string): Date|null {
    if (dateString == "now") return new Date()
    const [datePart, timePart] = dateString.split(' '); // Split date and time
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    //check if date params are valid
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2025 || hours < 0 || hours > 24 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        return null;
    }

    return new Date(year, month-1, day, hours, minutes, seconds);
}

/**## convertTime `utility function`
 * Use this function to convert a time by value and unit to milliseconds.
 * 
 * @param value The value to convert.
 * 
 * @param unit The unit of the value (seconds, minutes, hours, days, months or years).
 * 
 * @returns The value converted to milliseconds.
 */
export function convertTime(value: number, unit: "seconds"|"minutes"|"hours"|"days"|"months"|"years") {
    switch (unit) {
        case "seconds":
            return value * 1000
        case "minutes":
            return value * 1000 * 60
        case "hours":
            return value * 1000 * 60 * 60
        case "days":
            return value * 1000 * 60 * 60 * 24
        case "months":
            return value * 1000 * 60 * 60 * 24 * 30
        case "years":
            return value * 1000 * 60 * 60 * 24 * 365
    }
}