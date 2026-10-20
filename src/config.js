// Development server (Android emulator reaches your computer at 10.0.2.2).
// On a real phone use your computer's Wi-Fi IP, e.g. 'http://192.168.1.5:8000/api'.
const DEV_API_URL = 'http://10.0.2.2:8000/api';

// Your live server. Release builds use this automatically.
const PROD_API_URL = 'https://api.yourdomain.com/api';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const ROLE = 'customer';

// Brand: change these to rename the app everywhere inside it
export const APP_NAME = 'EatHomeFood';
export const TAGLINE = 'Hot food, delivered fast.';
