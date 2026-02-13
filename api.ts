export const storage = {
    get: async (key: string) => {
        try {
            const res = await fetch(`/api/storage/${key}`);
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
