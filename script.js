async function getHeroes() {
    const response = await fetch('https://overfast-api.tekrop.fr/heroes');
    const heroes = await response.json();
    console.log(heroes);

    document.getElementById('heroes').innerHTML = heroes.map(hero => `
        <div class="hero">
            <h2>${hero.name}</h2>
            <img src="${hero.portrait}" alt="${hero.name}">
            <p>${hero.role}: ${hero.subrole}</p>
        </div>
    `).join('');
}

getHeroes();