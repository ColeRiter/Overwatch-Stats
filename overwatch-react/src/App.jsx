import { useState, useEffect } from "react";
import { getHeroes, getHeroStats, getMaps } from "./api";
import HeroDetail from "./components/HeroDetail.jsx";
import MapDetail from "./components/MapDetail.jsx";
import PlayerSearch from "./components/PlayerSearch.jsx";
import "./index.css";
import "./styles.css";

function App() {
    const [heroes, setHeroes] = useState([]);
    const [maps, setMaps] = useState([]);
    const [stats, setStats] = useState([]);
    const [selectedHero, setSelectedHero] = useState(null);
    const [selectedMap, setSelectedMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("heroes"); // "heroes" or "maps"

    useEffect(() => {
        load();
    }, []);

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
            </header>

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="search-container">
                <PlayerSearch />
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
