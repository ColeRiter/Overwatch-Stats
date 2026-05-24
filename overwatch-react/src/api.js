const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function authHeaders(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestJson(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
}

export async function registerUser(username, password) {
    return requestJson("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export async function loginUser(username, password) {
    return requestJson("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
}

export async function logoutUser(token) {
    return requestJson("/auth/logout", {
        method: "POST",
        headers: authHeaders(token),
    });
}

export async function getCurrentUser(token) {
    return requestJson("/auth/me", {
        headers: authHeaders(token),
    });
}

export async function linkBattleNetAccount(token, profile) {
    return requestJson("/profile/battlenet", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(profile),
    });
}

export async function getSearchHistory(token) {
    return requestJson("/search-history", {
        headers: authHeaders(token),
    });
}

export async function saveSearchHistory(token, search) {
    return requestJson("/search-history", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(search),
    });
}

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
