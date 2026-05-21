import { useState } from "react";
import { searchPlayer, getPlayerSummary, getPlayerStatsSummary } from "../api";

function renderStatValue(value, suffix = "") {
    if (value == null) return "N/A";
    if (typeof value === "number") {
        return `${value}${suffix}`;
    }
    return value;
}

function getHeroSummaryFields(stats) {
    if (!stats) return null;

    const total = stats.total || {};
    return {
        gamesPlayed: stats.games_played ?? stats.games?.played ?? "N/A",
        winrate: stats.winrate ?? stats.win_rate ?? "N/A",
        kda: stats.kda ?? "N/A",
        damage: total.damage ?? stats.damage ?? "N/A",
        healing: total.healing ?? stats.healing ?? "N/A",
    };
}

export default function PlayerSearch() {

    const [input, setInput] = useState("");
    const [player, setPlayer] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);
    const [sortField, setSortField] = useState("winrate");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function handleSearch() {
        if (!input || input.trim().length === 0) return;

        setLoading(true);
        setError(null);
        setPlayer(null);
        setPlayerStats(null);

        try {
            const res = await searchPlayer(input);
            const found = res.results?.[0];

            if (!found) {
                setError("No player found. Check console for API response.");
                return;
            }

            const summary = await getPlayerSummary(found.player_id);
            const statsSummary = await getPlayerStatsSummary(found.player_id);

            if (!summary) {
                setError("Failed to load player summary.");
                return;
            }

            setPlayer(summary);
            setPlayerStats(statsSummary);
        } catch (err) {
            console.error("Player search failed", err);
            setError("Error fetching player or stats. Check console for details.");
            setPlayer(null);
            setPlayerStats(null);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyPress(e) {
        if (e.key === "Enter") {
            handleSearch();
        }
    }

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    function getSortValue(summary, field) {
        if (!summary) return -Infinity;
        const value = summary[field];
        return typeof value === "number" ? value : -Infinity;
    }

    const heroStats = playerStats?.heroes ? Object.entries(playerStats.heroes).map(([heroKey, heroData]) => {
        return {
            heroKey,
            heroData,
            summary: getHeroSummaryFields(heroData),
        };
    }).sort((a, b) => {
        const aValue = getSortValue(a.summary, sortField);
        const bValue = getSortValue(b.summary, sortField);
        return bValue - aValue;
    }) : [];

    return (
        <div style={{ marginBottom: 20 }}>
            <h3>Player Search</h3>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter username or BattleTag"
                style={{ padding: "8px", marginRight: "8px", width: "220px" }}
            />

            <button 
                onClick={handleSearch}
                disabled={loading}
                style={{ padding: "8px 16px" }}
            >
                {loading ? "Searching..." : "Search"}
            </button>

            {error && (
                <p style={{ color: "red", marginTop: "10px" }}>
                    {error}
                </p>
            )}

            {player && (
                <div style={{ border: "1px solid #ccc", padding: "10px", marginTop: "10px", maxWidth: "500px" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <img src={player.avatar} alt={player.username} width="80" />
                        <div>
                            <h2 style={{ marginTop: 0 }}>{player.username}</h2>
                            <p><b>Title:</b> {player.title || "N/A"}</p>
                            <p><b>Endorsement:</b> {player.endorsement?.level ?? "N/A"}</p>
                            <p><b>Last Updated:</b> {formatDate(player.last_updated_at)}</p>
                        </div>
                    </div>

                    {playerStats ? (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <h4 style={{ margin: 0 }}>Hero statistics</h4>
                                <div>
                                    <label htmlFor="sortField" style={{ marginRight: 8, fontWeight: "bold" }}>Sort by:</label>
                                    <select
                                        id="sortField"
                                        value={sortField}
                                        onChange={(e) => setSortField(e.target.value)}
                                        style={{ padding: "4px 8px" }}
                                    >
                                        <option value="winrate">Win rate</option>
                                        <option value="kda">KDA</option>
                                        <option value="damage">Damage</option>
                                        <option value="healing">Healing</option>
                                        <option value="gamesPlayed">Games played</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                                {heroStats.length === 0 ? (
                                    <p>No hero stats available.</p>
                                ) : heroStats.map(({ heroKey, heroData, summary }) => (
                                    <div key={heroKey} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
                                        <h5 style={{ margin: "0 0 8px" }}>{heroKey}</h5>
                                        <p style={{ margin: "2px 0" }}><b>Games:</b> {renderStatValue(summary.gamesPlayed)}</p>
                                        <p style={{ margin: "2px 0" }}><b>Win rate:</b> {renderStatValue(summary.winrate, "%")}</p>
                                        <p style={{ margin: "2px 0" }}><b>KDA:</b> {renderStatValue(summary.kda)}</p>
                                        <p style={{ margin: "2px 0" }}><b>Damage:</b> {renderStatValue(summary.damage)}</p>
                                        <p style={{ margin: "2px 0" }}><b>Healing:</b> {renderStatValue(summary.healing)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ marginTop: 16 }}><i>No player stats summary available.</i></p>
                    )}
                </div>
            )}
        </div>
    );
}
