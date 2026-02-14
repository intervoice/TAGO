export const storage = {
    get: async (key: string) => {
        try {
            // Disable cache to ensure fresh data is fetched from the server
            const res = await fetch(`/api/storage/${key}?t=${Date.now()}`, { cache: 'no-store' });
            if (res.status === 404) return null; // Logic: Key doesn't exist yet
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); // Logic: Server error
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            throw err; // Propagate error so App.tsx knows it failed
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
