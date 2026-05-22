import { useEffect, useState } from "react";
import { getHeroDetails, getroledescription } from "../api";

export default function HeroDetail({ hero, onBack }) {

    const [data, setData] = useState(null);
    const [roleData, setRoleData] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await getHeroDetails(hero.key);
        setData(res);

        if (res?.role) {
            const roleInfo = await getroledescription(res.role.toLowerCase());
            setRoleData(roleInfo);
        }
    }

    if (!data) return <p className="loading-screen">Loading...</p>;

    return (
        <div className="detail-page">
            <button className="detail-back" onClick={onBack}>← Back</button>

            <div className="detail-card">
                <h1>{data.name}</h1>
                <img className="detail-image" src={data.portrait} alt={data.name} />
                <p className="detail-description">{data.description}</p>

                <div className="detail-meta">
                    <div className="detail-meta-item">
                        <b>Role</b>
                        <div className="detail-meta-value">
                            {roleData?.icon && (
                                <img className="meta-icon" src={roleData.icon} alt={roleData.name} />
                            )}
                            <span>{data.role}</span>
                        </div>
                    </div>
                    <div className="detail-meta-item">
                        <b>Subrole</b>
                        <span>{data.subrole}</span>
                    </div>
                </div>

                <h3>Abilities</h3>
                <ul className="ability-list">
                    {data.abilities.map(a => (
                        <li key={a.name} className="ability-item">
                            <strong>{a.name}</strong>
                            <p>{a.description}</p>
                        </li>
                    ))}
                </ul>

                {data.story?.summary && (
                    <div className="detail-story">
                        <h3>Story</h3>
                        <p>{data.story.summary}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
