import { useState, useEffect } from "react";
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { getCurrentUser, getHeroes, getHeroStats, getMaps, loginUser, logoutUser, registerUser } from "./api";
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
    const [stats, setStats] = useState([]);
    const [selectedHero, setSelectedHero] = useState(null);
    const [selectedMap, setSelectedMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("heroes"); // "heroes" or "maps"

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

            const statsData = await getHeroStats();
            setStats(statsData || []);
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

    const statMap = {};
    stats.forEach(s => statMap[s.hero?.toLowerCase()] = s);

    if (selectedHero) {
        return (
            <HeroDetail
                hero={selectedHero}
                onBack={() => setSelectedHero(null)}
            />
        );
    }

    if (selectedMap) {
        return (
            <MapDetail
                map={selectedMap}
                onBack={() => setSelectedMap(null)}
            />
        );
    }

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
                    <p className="page-subtitle">View heroes and maps or search for players and compare</p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            type="button"
                            className={view === "heroes" ? "toggle-button active" : "toggle-button"}
                            onClick={() => setView("heroes")}
                        >
                            Heroes
                        </button>
                        <button
                            type="button"
                            className={view === "maps" ? "toggle-button active" : "toggle-button"}
                            onClick={() => setView("maps")}
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

            <div className="search-container">
                <PlayerSearch authToken={authToken} user={user} onUserUpdate={setUser} />
            </div>

            <div className="cards-grid">
                {view === "heroes" && heroes.length === 0 && (
                    <p className="empty-state">No heroes available.</p>
                )}

                {view === "maps" && maps.length === 0 && (
                    <p className="empty-state">No maps available.</p>
                )}

                {view === "heroes" && heroes.map(hero => (
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

                {view === "maps" && maps.map(map => (
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
        </div>
    );
}

export default App;
