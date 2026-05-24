import { useEffect, useState } from "react";
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import {
    getSearchHistory,
    linkBattleNetAccount,
    searchPlayer,
    getPlayerSummary,
    getPlayerStatsSummary,
    saveSearchHistory,
} from "../api";

function formatNumber(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return value;
    if (Number.isInteger(value)) return `${value}`;
    return value.toFixed(2);
}

function renderStatValue(value, suffix = "") {
    if (value == null) return "N/A";
    if (typeof value === "number") {
        return `${formatNumber(value)}${suffix}`;
    }
    return value;
}

function getHeroSummaryFields(stats) {
    if (!stats) return null;

    const total = stats.total || {};
    const gamesPlayed = stats.games_played ?? stats.games?.played ?? 0;
    const safeGamesPlayed = Math.max(1, typeof gamesPlayed === "number" ? gamesPlayed : 1);
    const damageTotal = total.damage ?? stats.damage ?? 0;
    const healingTotal = total.healing ?? stats.healing ?? 0;

    return {
        gamesPlayed: typeof gamesPlayed === "number" ? gamesPlayed : 0,
        winrate: stats.winrate ?? stats.win_rate ?? "N/A",
        kda: stats.kda ?? "N/A",
        damagePerGame: damageTotal / safeGamesPlayed,
        healingPerGame: healingTotal / safeGamesPlayed,
    };
}

export default function PlayerSearch({ authToken, user, onUserUpdate }) {

    const [input, setInput] = useState("");
    const [linkInput, setLinkInput] = useState("");
    const [player, setPlayer] = useState(null);
    const [currentPlayerId, setCurrentPlayerId] = useState("");
    const [playerStats, setPlayerStats] = useState(null);
    const [compareMode, setCompareMode] = useState(false);
    const [compareInput, setCompareInput] = useState("");
    const [comparePlayer, setComparePlayer] = useState(null);
    const [comparePlayerStats, setComparePlayerStats] = useState(null);
    const [compareError, setCompareError] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [sortField, setSortField] = useState("winrate");
    const [error, setError] = useState(null);
    const [linkError, setLinkError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);
    const [compareLoading, setCompareLoading] = useState(false);

    async function loadSavedSearches() {
        if (!authToken || !user) {
            setSuggestions([]);
            return;
        }

        try {
            const data = await getSearchHistory(authToken);
            const historySuggestions = (data.history ?? []).map((item) => ({
                label: item.username || item.query,
                query: item.query,
                score: new Date(item.searched_at).getTime(),
            }));

            setSuggestions(historySuggestions.slice(0, 3));

            if (historySuggestions[0]) {
                setInput(historySuggestions[0].query);
            }
        } catch (err) {
            console.error("loadSavedSearches failed", err);
        }
    }

    useEffect(() => {
        loadSavedSearches();
    }, [authToken, user?.id]);

    useEffect(() => {
        if (!user) {
            setLinkInput("");
            return;
        }

        setLinkInput(user.battlenet_tag || "");

        if (user.battlenet_player_id) {
            loadPlayerById(user.battlenet_player_id, {
                query: user.battlenet_tag || user.battlenet_username || user.battlenet_player_id,
                clearCompare: true,
            });
        }
    }, [user?.id, user?.battlenet_player_id]);

    async function loadPlayerById(playerId, options = {}) {
        const summary = await getPlayerSummary(playerId);
        const statsSummary = await getPlayerStatsSummary(playerId);

        if (!summary) {
            throw new Error("Failed to load player summary.");
        }

        if (options.clearCompare) {
            setCompareMode(false);
            setCompareInput("");
            setComparePlayer(null);
            setComparePlayerStats(null);
            setCompareError(null);
        }

        setInput(options.query || summary.username || playerId);
        setPlayer(summary);
        setCurrentPlayerId(playerId);
        setPlayerStats(statsSummary);

        return { summary, statsSummary };
    }

    async function linkPlayerToAccount({ playerId, battleTag, username, avatar }) {
        if (!authToken || !user) return;

        const data = await linkBattleNetAccount(authToken, {
            battlenet_tag: battleTag,
            player_id: playerId,
            username,
            avatar,
        });
        onUserUpdate?.(data.user);
    }

    async function handleSearch() {
        if (!input || input.trim().length === 0) return;

        setLoading(true);
            setError(null);
            setPlayer(null);
            setCurrentPlayerId("");
            setPlayerStats(null);
        setCompareMode(false);
        setCompareInput("");
        setComparePlayer(null);
        setComparePlayerStats(null);
        setCompareError(null);

        try {
            const res = await searchPlayer(input);
            const found = res.results?.[0];

            if (!found) {
                setError("No player found. Check console for API response.");
                return;
            }

            const { summary, statsSummary } = await loadPlayerById(found.player_id, {
                query: input.trim(),
            });

            const newSuggestions = (res.results ?? [])
                .map((item) => ({
                    label: item.username || item.name || item.player_name || item.player_id || "",
                    query: item.username || item.name || item.player_name || item.player_id || "",
                    score: item.games_played ?? item.playtime ?? item.rating ?? 0,
                }))
                .filter((item) => item.label)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            setSuggestions(newSuggestions);
            setPlayer(summary);
            setPlayerStats(statsSummary);

            if (authToken && user) {
                try {
                    await saveSearchHistory(authToken, {
                        player_id: found.player_id,
                        query: input.trim(),
                        username: summary.username || found.username || found.name,
                        avatar: summary.avatar,
                    });
                    await loadSavedSearches();
                } catch (err) {
                    console.error("saveSearchHistory failed", err);
                }
            }
        } catch (err) {
            console.error("Player search failed", err);
            setError("Error fetching player or stats. Check console for details.");
            setPlayer(null);
            setPlayerStats(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleLinkBattleTag() {
        if (!authToken || !user || !linkInput.trim()) return;

        setLinkLoading(true);
        setLinkError(null);
        setError(null);

        try {
            const res = await searchPlayer(linkInput);
            const found = res.results?.[0];

            if (!found) {
                setLinkError("No player found for that BattleTag.");
                return;
            }

            const { summary } = await loadPlayerById(found.player_id, {
                query: linkInput.trim(),
                clearCompare: true,
            });

            await linkPlayerToAccount({
                playerId: found.player_id,
                battleTag: linkInput.trim(),
                username: summary.username || found.username || found.name,
                avatar: summary.avatar,
            });
        } catch (err) {
            console.error("handleLinkBattleTag failed", err);
            setLinkError(err.message || "Failed to link BattleTag.");
        } finally {
            setLinkLoading(false);
        }
    }

    async function handleLinkCurrentPlayer() {
        if (!authToken || !user || !player || !currentPlayerId) return;

        setLinkLoading(true);
        setLinkError(null);

        try {
            await linkPlayerToAccount({
                playerId: currentPlayerId,
                battleTag: input.trim(),
                username: player.username,
                avatar: player.avatar,
            });
        } catch (err) {
            console.error("handleLinkCurrentPlayer failed", err);
            setLinkError(err.message || "Failed to link player.");
        } finally {
            setLinkLoading(false);
        }
    }

    async function handleCompareSearch() {
        if (!compareInput || compareInput.trim().length === 0) return;

        setCompareLoading(true);
        setCompareError(null);
        setComparePlayer(null);
        setComparePlayerStats(null);

        try {
            const res = await searchPlayer(compareInput);
            const found = res.results?.[0];

            if (!found) {
                setCompareError("No player found for comparison.");
                return;
            }

            const summary = await getPlayerSummary(found.player_id);
            const statsSummary = await getPlayerStatsSummary(found.player_id);

            if (!summary) {
                setCompareError("Failed to load compare player summary.");
                return;
            }

            setComparePlayer(summary);
            setComparePlayerStats(statsSummary);
        } catch (err) {
            console.error("Compare search failed", err);
            setCompareError("Error fetching compare player or stats. Check console for details.");
            setComparePlayer(null);
            setComparePlayerStats(null);
        } finally {
            setCompareLoading(false);
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

    function getDelta(primary, comparison) {
        if (typeof primary !== "number" || typeof comparison !== "number") return null;
        return comparison - primary;
    }

    function renderDelta(value, suffix = "") {
        if (value == null || value === 0) return null;
        if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) return null;
        const sign = value > 0 ? "+" : "";
        return `${sign}${formatNumber(value)}${suffix}`;
    }

    function handleInputFocus() {
        setShowSuggestions(true);
    }

    function handleInputBlur() {
        setTimeout(() => setShowSuggestions(false), 150);
    }

    function handleSuggestionClick(value) {
        setInput(value);
        setShowSuggestions(false);
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

    const compareHeroStats = (comparePlayerStats?.heroes && heroStats.length) ? heroStats.map(({ heroKey, summary: primarySummary }) => {
        const heroData = comparePlayerStats.heroes[heroKey];
        if (!heroData) return null;
        const summary = getHeroSummaryFields(heroData);

        return {
            heroKey,
            heroData,
            summary,
            delta: {
                gamesPlayed: getDelta(primarySummary.gamesPlayed, summary.gamesPlayed),
                winrate: getDelta(primarySummary.winrate, summary.winrate),
                kda: getDelta(primarySummary.kda, summary.kda),
                damagePerGame: getDelta(primarySummary.damagePerGame, summary.damagePerGame),
                healingPerGame: getDelta(primarySummary.healingPerGame, summary.healingPerGame),
            },
        };
    }).filter(Boolean) : [];

    function renderPlayerCard({ playerData, statsData, heroStatsData, showSort = false, isCompare = false }) {
        return (
            <div style={{ border: "1px solid #ccc", padding: "10px", minWidth: 0, width: "100%" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img src={playerData.avatar} alt={playerData.username} width="80" />
                    <div>
                        <h2 style={{ marginTop: 0 }}>{playerData.username}</h2>
                        <p><b>Title:</b> {playerData.title || "N/A"}</p>
                        <p><b>Endorsement:</b> {playerData.endorsement?.level ?? "N/A"}</p>
                        <p><b>Last Updated:</b> {formatDate(playerData.last_updated_at)}</p>
                    </div>
                </div>

                {statsData ? (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <h4 style={{ margin: 0 }}>Hero statistics</h4>
                            {showSort && (
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
                                        <option value="damagePerGame">Damage / game</option>
                                        <option value="healingPerGame">Healing / game</option>
                                        <option value="gamesPlayed">Games played</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                            {heroStatsData.length === 0 ? (
                                <p>No hero stats available.</p>
                            ) : heroStatsData.map(({ heroKey, summary, delta }) => {
                                const renderDiff = (field, suffix = "") => {
                                    if (!isCompare || !delta) return null;
                                    const diffValue = delta[field];
                                    const formatted = renderDelta(diffValue, suffix);
                                    if (!formatted) return null;
                                    const color = diffValue > 0 ? "#187b37" : diffValue < 0 ? "#b02a37" : "#333";
                                    return (
                                        <span style={{ color, marginLeft: 6, fontWeight: 600 }}>
                                            {formatted}
                                        </span>
                                    );
                                };

                                return (
                                    <div key={heroKey} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10 }}>
                                        <h5 style={{ margin: "0 0 8px" }}>{heroKey}</h5>
                                        <p style={{ margin: "2px 0" }}><b>Games:</b> {renderStatValue(summary.gamesPlayed)}{renderDiff("gamesPlayed")}</p>
                                        <p style={{ margin: "2px 0" }}><b>Win rate:</b> {renderStatValue(summary.winrate, "%")}{renderDiff("winrate", "%")}</p>
                                        <p style={{ margin: "2px 0" }}><b>KDA:</b> {renderStatValue(summary.kda)}{renderDiff("kda")}</p>
                                        <p style={{ margin: "2px 0" }}><b>Damage / game:</b> {renderStatValue(summary.damagePerGame)}{renderDiff("damagePerGame")}</p>
                                        <p style={{ margin: "2px 0" }}><b>Healing / game:</b> {renderStatValue(summary.healingPerGame)}{renderDiff("healingPerGame")}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <p style={{ marginTop: 16 }}><i>No player stats summary available.</i></p>
                )}
            </div>
        );
    }

    return (
        <div style={{ marginBottom: 20 }}>
            <h3>Player Search</h3>
            {user && (
                <p style={{ marginTop: -8, color: "#566071" }}>
                    Last searches are saved for {user.username}.
                </p>
            )}
            {user && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "10px 0 14px" }}>
                    <input
                        type="text"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="Link your BattleTag"
                        style={{ padding: "8px", width: "220px" }}
                    />
                    <button
                        type="button"
                        onClick={handleLinkBattleTag}
                        disabled={linkLoading}
                        style={{ padding: "8px 16px" }}
                    >
                        {linkLoading ? "Linking..." : user.battlenet_player_id ? "Update Link" : "Link BattleTag"}
                    </button>
                    {user.battlenet_username && (
                        <span style={{ alignSelf: "center", color: "#566071" }}>
                            Linked: {user.battlenet_username}
                        </span>
                    )}
                </div>
            )}
            {linkError && (
                <p style={{ color: "red", marginTop: "8px" }}>
                    {linkError}
                </p>
            )}
            <div style={{ position: "relative", display: "inline-block" }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter username or BattleTag"
                    style={{ padding: "8px", marginRight: "8px", width: "220px" }}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        width: "220px",
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                        zIndex: 10,
                        marginTop: 6,
                    }}>
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion.query}
                                type="button"
                                onMouseDown={() => handleSuggestionClick(suggestion.query)}
                                style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    border: "none",
                                    background: "transparent",
                                    color: "#000",
                                    cursor: "pointer",
                                }}
                            >
                                {suggestion.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={handleSearch}
                disabled={loading}
                style={{ padding: "8px 16px" }}
            >
                {loading ? "Searching..." : "Search"}
            </button>

            {player && (
                <button
                    type="button"
                    onClick={() => setCompareMode((prev) => !prev)}
                    style={{ padding: "8px 14px", marginLeft: 12 }}
                >
                    {compareMode ? "Hide Compare" : "Compare Player"}
                </button>
            )}

            {user && player && (
                <button
                    type="button"
                    onClick={handleLinkCurrentPlayer}
                    disabled={linkLoading}
                    style={{ padding: "8px 14px", marginLeft: 12 }}
                >
                    {linkLoading ? "Linking..." : "Link This Player"}
                </button>
            )}

            {compareMode && player && (
                <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginLeft: 12, marginTop: 8 }}>
                    <input
                        type="text"
                        value={compareInput}
                        onChange={(e) => setCompareInput(e.target.value)}
                        placeholder="Enter another username"
                        style={{ padding: "8px", width: "220px" }}
                    />
                    <button
                        type="button"
                        onClick={handleCompareSearch}
                        disabled={compareLoading}
                        style={{ padding: "8px 16px" }}
                    >
                        {compareLoading ? "Comparing..." : "Search Compare"}
                    </button>
                </span>
            )}

            {error && (
                <p style={{ color: "red", marginTop: "10px" }}>
                    {error}
                </p>
            )}

            {compareError && compareMode && (
                <p style={{ color: "red", marginTop: "10px" }}>
                    {compareError}
                </p>
            )}

            {player && (
                <div style={{ display: "grid", gridTemplateColumns: comparePlayer ? "1fr 1fr" : "1fr", gap: 16, marginTop: "10px" }}>
                    {renderPlayerCard({
                        playerData: player,
                        statsData: playerStats,
                        heroStatsData: heroStats,
                        showSort: true,
                        isCompare: false,
                    })}

                    {comparePlayer && renderPlayerCard({
                        playerData: comparePlayer,
                        statsData: comparePlayerStats,
                        heroStatsData: compareHeroStats,
                        showSort: false,
                        isCompare: true,
                    })}
                </div>
            )}
        </div>
    );
}
