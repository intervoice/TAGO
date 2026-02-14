export const storage = {
    get: async (key: string) => {
        try {
            // Disable cache to ensure fresh data is fetched from the server and avoid overwriting with stale Empty data on valid save
            const res = await fetch(`/api/storage/${key}?t=${Date.now()}`, { cache: 'no-store' });
            if (res.status === 404) return null;
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            return null;
        }
    },
    set: async (key: string, value: any) => {
        try {
            await fetch(`/api/storage/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(value),
            });
        } catch (err) {
            console.error(`Error saving ${key}:`, err);
        }
    }
};
