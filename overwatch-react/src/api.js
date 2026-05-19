const BASE_URL = "https://overfast-api.tekrop.fr";

export async function getHeroes() {
    try {
        const res = await fetch(`${BASE_URL}/heroes`);
        return await res.json();
    } catch (err) {
        console.error("getHeroes failed", err);
        return [];
    }
}

export async function getHeroDetails(heroKey) {
    try {
        const res = await fetch(`${BASE_URL}/heroes/${heroKey}`);
        return await res.json();
    } catch (err) {
        console.error("getHeroDetails failed", err);
        return null;
    }
}

export async function searchPlayer(name) {
    try {
        const res = await fetch(`${BASE_URL}/players?name=${encodeURIComponent(name)}`);
        return await res.json();
    } catch (err) {
        console.error("searchPlayer failed", err);
        return {};
    }
}

export async function getPlayerSummary(playerId) {
    try {
        const res = await fetch(`${BASE_URL}/players/${playerId}/summary`);
        return await res.json();
    } catch (err) {
        console.error("getPlayerSummary failed", err);
        return null;
    }
}

export async function getHeroStats() {
    try {
        const res = await fetch(
            `${BASE_URL}/heroes/stats?platform=pc&gamemode=quickplay&region=americas`
        );

        const json = await res.json();
        return json.data || [];

    } catch {
        return [];
    }
}