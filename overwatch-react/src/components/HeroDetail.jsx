import { useEffect, useState } from "react";
import { getHeroDetails } from "../api";

export default function HeroDetail({ hero, onBack }) {

    const [data, setData] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        const res = await getHeroDetails(hero.key);
        setData(res);
    }

    if (!data) return <p>Loading...</p>;

    return (
        <div>
            <button onClick={onBack}>← Back</button>

            <h1>{data.name}</h1>
            <p>{data.description}</p>

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
