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

    if (!data) return <p>Loading...</p>;

    return (
        <div>
            <button onClick={onBack}>← Back</button>

            <h1>{data.name}</h1>
            <img src={data.portrait} alt={data.name} />
            <p>{data.description}</p>
            <p>
                <b>Role:</b>
                <span style={{ marginLeft: roleData?.icon ? 8 : 4 }}>{data.role}: {roleData.description}</span>
            </p>
            <p><b>Subrole:</b> {data.subrole}</p>
            <h3>Abilities</h3>
            <ul>
                {data.abilities.map(a => (
                    <li key={a.name}>
                        <b>{a.name}</b>: {a.description}
                    </li>
                ))}
            </ul>

            <p>{data.story?.summary}</p>
        </div>
    );
}
