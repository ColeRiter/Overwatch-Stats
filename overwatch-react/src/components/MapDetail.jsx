export default function MapDetail({ map, onBack }) {
    return (
        <div>
            <button onClick={onBack}>← Back</button>

            <h1>{map.name}</h1>
            <img src={map.screenshot} alt={map.name} style={{ maxWidth: "600px", width: "100%" }} />
            <p><b>Location:</b> {map.location}</p>
            <p><b>Country Code:</b> {map.country_code}</p>
            {map.gamemodes && map.gamemodes.length > 0 && (
                <>
                    <h3>Game Modes</h3>
                    <ul>
                        {map.gamemodes.map(mode => (
                            <li key={mode}>{mode}</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
