import { useState } from "react";
import { searchPlayer, getPlayerSummary } from "../api";

export default function PlayerSearch() {

    const [input, setInput] = useState("");
    const [player, setPlayer] = useState(null);

    async function handleSearch() {
        if (!input || input.trim().length === 0) return;

        try {
            const res = await searchPlayer(input);
            const found = res.results?.[0];

            if (!found) {
                setPlayer(null);
                return;
            }

            const summary = await getPlayerSummary(found.player_id);
            setPlayer(summary);
        } catch (err) {
            console.error("Player search failed", err);
            setPlayer(null);
        }
    }

    return (
        <div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter username"
            />

            <button onClick={handleSearch}>
                Search
            </button>

            {player && (
                <div>
                    <img src={player.avatar} width="80" />
                    <h3>{player.username}</h3>
                    <p>{player.title}</p>
                </div>
            )}
        </div>
    );
}
