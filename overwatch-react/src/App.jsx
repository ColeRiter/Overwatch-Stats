import { useState, useEffect } from "react";
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { getCurrentUser, getHeroes, getMaps, loginUser, logoutUser, registerUser } from "./api";
import HeroDetail from "./components/HeroDetail.jsx";
import MapDetail from "./components/MapDetail.jsx";
import PlayerSearch from "./components/PlayerSearch.jsx";
import "./index.css";
import "./styles.css";

function App() {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem("authToken") || "");
    const [user, setUser] = useState(null);
    const [authMode, setAuthMode] = useState("login");
    const [authUsername, setAuthUsername] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authError, setAuthError] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [heroes, setHeroes] = useState([]);
    const [maps, setMaps] = useState([]);
    const [selectedHero, setSelectedHero] = useState(null);
    const [selectedMap, setSelectedMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("players");
    const [globalPlayerSearch, setGlobalPlayerSearch] = useState("");
    const [playerSearchRequest, setPlayerSearchRequest] = useState(null);

    async function restoreUser() {
        if (!authToken) {
            setUser(null);
            return;
        }

        try {
            const data = await getCurrentUser(authToken);
            setUser(data.user);
        } catch (err) {
            console.error("restoreUser failed", err);
            localStorage.removeItem("authToken");
            setAuthToken("");
            setUser(null);
        }
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError(null);

        try {
            const authFn = authMode === "login" ? loginUser : registerUser;
            const data = await authFn(authUsername, authPassword);
            localStorage.setItem("authToken", data.token);
            setAuthToken(data.token);
            setUser(data.user);
            setAuthUsername("");
            setAuthPassword("");
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    }

    async function handleLogout() {
        try {
            await logoutUser(authToken);
        } catch (err) {
            console.error("logout failed", err);
        } finally {
            localStorage.removeItem("authToken");
            setAuthToken("");
            setUser(null);
        }
    }

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const heroData = await getHeroes();
            setHeroes(heroData || []);

            const mapData = await getMaps();
            setMaps(mapData || []);
        } catch (err) {
            console.error("load failed", err);
            setError("Failed to load data. Check console for details.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        restoreUser();
    }, [authToken]);

    function handleNavChange(nextView) {
        setView(nextView);
        setSelectedHero(null);
        setSelectedMap(null);
    }

    function handleGlobalPlayerSearch(e) {
        e.preventDefault();
        const query = globalPlayerSearch.trim();
        if (!query) return;

        setView("players");
        setSelectedHero(null);
        setSelectedMap(null);
        setPlayerSearchRequest({
            query,
            token: Date.now(),
        });
    }

    const pageTitles = {
        players: ["Player Search", "Search players and compare stats"],
        profile: ["Profile", "Manage your account and linked Battle.net profile"],
        heroes: ["Heroes", "Browse hero details"],
        maps: ["Maps", "Browse map details"],
    };

    const [pageTitle, pageSubtitle] = pageTitles[view] || pageTitles.players;

    if (loading) {
        return (
            <div className="app-shell">
                <header className="page-header">
                    <h1>Overwatch Stats</h1>
                </header>
                <div className="loading-screen">Loading…</div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <header className="page-header">
                <div>
                    <h1>Overwatch Stats</h1>
                    <p className="page-subtitle">{pageTitle} · {pageSubtitle}</p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            type="button"
                            className={view === "players" ? "toggle-button active" : "toggle-button"}
                            onClick={() => handleNavChange("players")}
                        >
                            Players
                        </button>
                        <button
                            type="button"
                            className={view === "profile" ? "toggle-button active" : "toggle-button"}
                            onClick={() => handleNavChange("profile")}
                        >
                            Profile
                        </button>
                        <button
                            type="button"
                            className={view === "heroes" ? "toggle-button active" : "toggle-button"}
                            onClick={() => handleNavChange("heroes")}
                        >
                            Heroes
                        </button>
                        <button
                            type="button"
                            className={view === "maps" ? "toggle-button active" : "toggle-button"}
                            onClick={() => handleNavChange("maps")}
                        >
                            Maps
                        </button>
                    </div>

                    {user ? (
                        <div className="auth-panel signed-in">
                            <span>
                                {user.username}
                                {user.battlenet_username && ` • ${user.battlenet_username}`}
                            </span>
                            <button type="button" onClick={handleLogout}>Logout</button>
                        </div>
                    ) : (
                        <form className="auth-panel" onSubmit={handleAuthSubmit}>
                            <div className="auth-tabs">
                                <button
                                    type="button"
                                    className={authMode === "login" ? "active" : ""}
                                    onClick={() => setAuthMode("login")}
                                >
                                    Login
                                </button>
                                <button
                                    type="button"
                                    className={authMode === "register" ? "active" : ""}
                                    onClick={() => setAuthMode("register")}
                                >
                                    Register
                                </button>
                            </div>
                            <input
                                type="text"
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                                placeholder="Username"
                                autoComplete="username"
                            />
                            <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                            />
                            <button type="submit" disabled={authLoading}>
                                {authLoading ? "Saving..." : authMode === "login" ? "Login" : "Create"}
                            </button>
                            {authError && <span className="auth-error">{authError}</span>}
                        </form>
                    )}
                </div>
            </header>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <form className="global-search" onSubmit={handleGlobalPlayerSearch}>
                <input
                    type="text"
                    value={globalPlayerSearch}
                    onChange={(e) => setGlobalPlayerSearch(e.target.value)}
                    placeholder="Search player or BattleTag"
                />
                <button type="submit">Search</button>
            </form>

            {view === "players" && (
                <div className="search-container">
                    <PlayerSearch
                        authToken={authToken}
                        user={user}
                        onUserUpdate={setUser}
                        searchRequest={playerSearchRequest}
                        hideSearchControls
                    />
                </div>
            )}

            {view === "profile" && (
                <section className="profile-page">
                    {user ? (
                        <>
                            <h2>{user.username}</h2>
                            <p>
                                {user.battlenet_player_id
                                    ? `Linked Battle.net ID: ${user.battlenet_username || user.battlenet_tag || user.battlenet_player_id}`
                                    : "No Battle.net ID linked yet."}
                            </p>
                            <PlayerSearch
                                authToken={authToken}
                                user={user}
                                onUserUpdate={setUser}
                                hideSearchControls
                                title="Your Battle.net Stats"
                            />
                        </>
                    ) : (
                        <p className="empty-state">Log in to view your profile.</p>
                    )}
                </section>
            )}

            {view === "heroes" && (
                selectedHero ? (
                    <HeroDetail
                        hero={selectedHero}
                        onBack={() => setSelectedHero(null)}
                    />
                ) : (
                    <div className="cards-grid">
                        {heroes.length === 0 && (
                            <p className="empty-state">No heroes available.</p>
                        )}

                        {heroes.map(hero => (
                            <button
                                key={hero.key}
                                type="button"
                                className="card"
                                onClick={() => setSelectedHero(hero)}
                            >
                                <img className="card-image" src={hero.portrait} alt={hero.name} />
                                <h3 className="card-title">{hero.name}</h3>
                            </button>
                        ))}
                    </div>
                )
            )}

            {view === "maps" && (
                selectedMap ? (
                    <MapDetail
                        map={selectedMap}
                        onBack={() => setSelectedMap(null)}
                    />
                ) : (
                    <div className="cards-grid">
                        {maps.length === 0 && (
                            <p className="empty-state">No maps available.</p>
                        )}

                        {maps.map(map => (
                            <button
                                key={map.key}
                                type="button"
                                className="card"
                                onClick={() => setSelectedMap(map)}
                            >
                                <img className="card-image" src={map.screenshot} alt={map.name} />
                                <h3 className="card-title">{map.name}</h3>
                                <p className="card-subtitle">{map.location}</p>
                            </button>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}

export default App;
