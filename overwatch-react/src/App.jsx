import { useState, useEffect } from "react";
import { getHeroes, getHeroStats, getMaps } from "./api";
import HeroDetail from "./components/HeroDetail.jsx";
import MapDetail from "./components/MapDetail.jsx";
import PlayerSearch from "./components/PlayerSearch.jsx";

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
            <div>
                <h1>Overwatch Stats</h1>
                <p>Loading…</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Overwatch Stats</h1>

            {error && (
                <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
            )}

            <PlayerSearch />

            <div style={{ marginBottom: 20 }}>
                <label>
                    <input
                        type="radio"
                        value="heroes"
                        checked={view === "heroes"}
                        onChange={(e) => setView(e.target.value)}
                    />
                    Heroes
                </label>
                <label style={{ marginLeft: 20 }}>
                    <input
                        type="radio"
                        value="maps"
                        checked={view === "maps"}
                        onChange={(e) => setView(e.target.value)}
                    />
                    Maps
                </label>
            </div>

            {view === "heroes" && (
                <div>
                    {heroes.length === 0 && (
                        <p>No heroes available.</p>
                    )}

                    {heroes.map(hero => (
                        <div
                            key={hero.key}
                            onClick={() => setSelectedHero(hero)}
                            style={{ cursor: "pointer", display: "inline-block", margin: 12, width: 160, verticalAlign: "top" }}
                        >
                            <img src={hero.portrait} alt={hero.name} width="120" />
                            <h3 style={{ margin: "8px 0 4px" }}>{hero.name}</h3>
                        </div>
                    ))}
                </div>
            )}

            {view === "maps" && (
                <div>
                    {maps.length === 0 && (
                        <p>No maps available.</p>
                    )}

                    {maps.map(map => (
                        <div
                            key={map.key}
                            onClick={() => setSelectedMap(map)}
                            style={{ cursor: "pointer", display: "inline-block", margin: 12, width: 160, verticalAlign: "top" }}
                        >
                            <img src={map.screenshot} alt={map.name} width="120" height="90" style={{ objectFit: "cover" }} />
                            <h3 style={{ margin: "8px 0 4px" }}>{map.name}</h3>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;
