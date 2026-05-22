export default function MapDetail({ map, onBack }) {
    return (
        <div className="detail-page">
            <button className="detail-back" onClick={onBack}>← Back</button>

            <div className="detail-card">
                <h1>{map.name}</h1>
                <img className="detail-image" src={map.screenshot} alt={map.name} />

                <div className="detail-meta">
                    <div className="detail-meta-item">
                        <b>Location</b>
                        <span>{map.location}</span>
                    </div>
                    <div className="detail-meta-item">
                        <b>Country Code</b>
                        <span>{map.country_code}</span>
                    </div>
                </div>

                {map.gamemodes && map.gamemodes.length > 0 && (
                    <div className="detail-section">
                        <h3>Game Modes</h3>
                        <ul className="ability-list">
                            {map.gamemodes.map(mode => (
                                <li key={mode} className="ability-item">{mode}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
