// File: frontend/js/constants.js

export const SUPABASE_URL = 'https://cjubzimgynglwitfvifn.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdWJ6aW1neW5nbHdpdGZ2aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDcwODUsImV4cCI6MjA4OTQyMzA4NX0.ZW0MU9OkFLVdJwOaERPvJO5-xGGtIKFMDArga46tJTg';

export const SYSTEM_CONFIG = {
    MAX_PSIKOLOG: 5,
    MAX_SESI: 7,
    get MAX_QUOTA() {
        return this.MAX_PSIKOLOG * this.MAX_SESI;
    }
};

// MENGGUNAKAN HASH ROUTING (Anti Error 404)
export const ROUTES = {
    HOME: '',
    ADMIN: '#/admin-rahasia',
    DISPLAY: '#/display'
};