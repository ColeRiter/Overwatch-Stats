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
        // Convert BattleTag format (# to -) if needed
        const formattedName = name.replace("#", "-");
        const res = await fetch(`${BASE_URL}/players?name=${encodeURIComponent(formattedName)}`);
        const data = await res.json();
        console.log("Search response:", data);
        return data;
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

export async function getPlayerStatsSummary(playerId, filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.gamemode) params.set("gamemode", filters.gamemode);
        if (filters.platform) params.set("platform", filters.platform);

        const query = params.toString();
        const res = await fetch(
            `${BASE_URL}/players/${encodeURIComponent(playerId)}/stats/summary${query ? `?${query}` : ""}`
        );

        if (!res.ok) {
            const text = await res.text();
            console.error(`getPlayerStatsSummary failed (${res.status}): ${text}`);
            return null;
        }

        return await res.json();
    } catch (err) {
        console.error("getPlayerStatsSummary failed", err);
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

export async function getroledescription(role) {
    try {
        const res = await fetch(`${BASE_URL}/roles`);
        const roles = await res.json();
        return roles.find(r => r.key === role) || null;
    }
    catch (err) {
        console.error("getroledescription failed", err);
        return null;
    }
}

export async function getMaps() {
    try {
        const res = await fetch(`${BASE_URL}/maps`);
        return await res.json();
    } catch (err) {
        console.error("getMaps failed", err);
        return [];
    }
}
