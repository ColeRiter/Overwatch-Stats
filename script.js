async function getHeroes() {

    const response = await fetch('https://overfast-api.tekrop.fr/heroes');
    const heroes = await response.json();

    let stats = [];

    try {
        const statsResponse = await fetch(
            "https://overfast-api.tekrop.fr/heroes/stats?platform=pc&gamemode=quickplay&region=americas"
        );

        if (!statsResponse.ok) {
            throw new Error("Stats API failed");
        }

        const statsJson = await statsResponse.json();
        stats = statsJson.data;

    } catch (err) {
        console.log("Stats API error:", err);
    }

    let output = ""; 

    heroes.forEach(hero => {

        const heroStats = stats.find(stat =>
            stat.hero && stat.hero.toLowerCase() === hero.key.toLowerCase()
        );

        output += `
        <div>
            <h2>${hero.name}</h2>
            <img 
                src="${hero.portrait}" 
                width="150"
                style="cursor:pointer"
                onclick="getHeroDetails('${hero.key}')"
    >
            <p>Role: ${hero.role} </p>
            <p>Subrole:${hero.subrole}</p>
            <p>
                Pick Rate:
                ${heroStats ? heroStats.pickrate : "N/A"}%
            </p>

            <p>
                Win Rate:
                ${heroStats ? heroStats.winrate : "N/A"}%
            </p>

            <hr>
        </div>
        `;
    });

    document.getElementById('heroes').innerHTML = output;
}

getHeroes();

async function getHeroDetails(heroKey) {

    const response = await fetch(
        `https://overfast-api.tekrop.fr/heroes/${heroKey}`
    );

    const hero = await response.json();

    showHeroDetails(hero);
}

function showHeroDetails(hero) {

    showDetail(); 

    const container = document.getElementById("hero-detail");

    container.innerHTML = `
        <button id="backBtn">← Back</button>

        <h1>${hero.name}</h1>

        <p>${hero.description}</p>

        <h3>Abilities</h3>
        <ul>
            ${(hero.abilities || []).map(a => `
                <li><b>${a.name}</b>: ${a.description}</li>
            `).join("")}
        </ul>

        <h3>Story</h3>
        <p>${hero.story.summary || "No story available"}</p>
    `;

    document.getElementById("backBtn").addEventListener("click", () => {
        showGrid();
    });
}

async function searchPlayer() {

    const name = document.getElementById("playerInput").value;

    const url = `https://overfast-api.tekrop.fr/players?name=${name}`;

    try {
        const res = await fetch(url);

        console.log("STATUS:", res.status);

        if (!res.ok) {
            throw new Error("Search failed");
        }

        const data = await res.json();

        console.log("SEARCH RESULT:", data);

        const player = data.results?.[0];

        if (!player) {
            document.getElementById("player-result").innerHTML =
                "No player found";
            return;
        }

        getPlayerSummary(player.player_id);

    } catch (err) {
        console.log("500 or API error:", err);

        document.getElementById("player-result").innerHTML =
            "Error fetching player (API issue or 500)";
    }
}

async function getPlayerSummary(playerId) {

    const url = `https://overfast-api.tekrop.fr/players/${playerId}/summary`;

    try {
        const res = await fetch(url);

        console.log("SUMMARY STATUS:", res.status);

        if (!res.ok) {
            throw new Error("Summary failed");
        }

        const player = await res.json();

        showPlayerCard(player);

    } catch (err) {
        console.log("Summary error:", err);

        document.getElementById("player-result").innerHTML =
            "Failed to load player summary (possible 500)";
    }
}

function showPlayerCard(player) {

    document.getElementById("player-result").innerHTML = `
        <div style="border:1px solid #ccc; padding:10px; margin-top:10px; width:300px;">

            <img src="${player.avatar}" width="80">

            <h2>${player.username}</h2>

            <p><b>Title:</b> ${player.title || "N/A"}</p>

            <p><b>Endorsement Level:</b> ${player.endorsement?.level ?? "N/A"}</p>

            <p><b>Last Updated:</b> ${new Date(player.last_updated_at * 1000).toLocaleString()}</p>

        </div>
    `;
}

function showGrid() {
    document.getElementById("heroes").style.display = "block";
    document.getElementById("hero-detail").style.display = "none";
}

function showDetail() {
    document.getElementById("heroes").style.display = "none";
    document.getElementById("hero-detail").style.display = "block";
}