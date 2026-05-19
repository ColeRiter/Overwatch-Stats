import { useState, useEffect } from "react";
import { getHeroes, getHeroStats } from "./api";
import HeroDetail from "./components/HeroDetail.jsx";
import PlayerSearch from "./components/PlayerSearch.jsx";

function App() {
    const [heroes, setHeroes] = useState([]);
    const [stats, setStats] = useState([]);
    const [selectedHero, setSelectedHero] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const heroData = await getHeroes();
            setHeroes(heroData || []);

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

                        <p>
                            Pick Rate: {statMap[hero.key]?.pickrate ?? "N/A"}%
                        </p>

                        <p>
                            Win Rate: {statMap[hero.key]?.winrate ?? "N/A"}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;