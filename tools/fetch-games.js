import fs from "node:fs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, maxAttempts = 4) {
    let waitMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch(url, options);

        if (response.status !== 429 && response.status !== 420) {
            await sleep(1000);
            return response;
        }

        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = retryAfter > 0 ? retryAfter * 1000 : waitMs;

        console.log(`Rate limited (${response.status}), attempt ${attempt}/${maxAttempts}. Waiting ${delay / 1000}s...`);
        await sleep(delay);
        waitMs *= 2;
    }

    return null;
}

const games = [];
const skippedGames = ['God of War']

const SR_BASE_URL = "https://www.speedrun.com/api/v1";


// IGDB API

const id = process.env.TWITCH_CLIENT_ID;
const secret = process.env.TWITCH_CLIENT_SECRET;

const igdbResponse = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
    { method: "POST" }
);
if (!igdbResponse.ok) {
    console.log("Token Request Failed:", igdbResponse.status, await igdbResponse.text());
    process.exit(1);
}

const data = await igdbResponse.json();
const token = data.access_token;

const igdbGamesResponse = await fetch(
    `https://api.igdb.com/v4/games`, { 
    method: "POST",
        headers: {
            "Client-ID": `${id}`,
            "Authorization": `Bearer ${token}`
        },
        body: "fields name, cover.image_id; limit 10; sort total_rating_count desc;"
})
if (!igdbGamesResponse.ok) {
    console.log("IGDB Games Request Failed:", igdbGamesResponse.status, await igdbGamesResponse.text());
    process.exit(1);
}
const igdbGames = await igdbGamesResponse.json();

for (const game of igdbGames) {
    // Speedrun.com API

    // Check if it should be skipped
    if (skippedGames.includes(game.name)) {
        continue;
    }

    // Initial Speedrun.com fetch
    const srResponse = await fetchWithRetry(
        `${SR_BASE_URL}/games?name=${encodeURIComponent(`${game.name}`)}&embed=categories,variables`
    );
    if (srResponse === null || !srResponse.ok) {
        console.log("Speedrun.com request failed, skipping: " + game.name);
        continue;
    };
    // Parse response of specific game into srData which is an array of all games partially matching the given name.
    // i.e. 'Grand Theft Auto V' returns 'gtav', 'gtavcs_remastered', etc.. 
    const srData = await srResponse.json();

    // Take that data and find() the entry whose name matches exactly
    const srGame = srData.data.find(gameEntry => gameEntry.names.international === game.name);
    if (srGame === undefined) {
        console.log("Undefined game, skipping: " + game.name);
        continue;
    }
    // Store the id value of that game (i.e. Grand Theft Auto V -> id: om1mx362)
    const gameId = srGame.id;

    // Go through the categories of the given game and return the first one that covers
    // the entire game and isn't miscellaneous (hopefully the most popular entry)
    const srCategory = srGame.categories.data.find(category => category.type === 'per-game' && !category.miscellaneous);
    if (srCategory === undefined) {
        console.log("Undefined category, skipping: " + game.name);
        continue;
    }
    // Store the id of that category
    const categoryId = srCategory.id;

    // Take the list of every variable attached to the game (glitchless/glitched, etc),
    // filter the list and keep every variable that matches our desired category, isn't a sub-category,
    // and covers the full game
    const srFilteredSubcategory = srGame.variables.data.filter(subcat => (subcat.category === srCategory.id || subcat.category === null) && subcat["is-subcategory"] === true && (subcat.scope.type === 'full-game' || subcat.scope.type === 'global'));

    // Join the variables together to build a URL to query to Speedrun.com for our desired game, category, and placement (the world-record) 
    const srUrlFilters = srFilteredSubcategory.map(subcat => `var-${subcat.id}=${subcat.values.default}`);
    console.log(srFilteredSubcategory)
    const srQueryString = "top=1&" + srUrlFilters.join("&");

    // Call the Speedrun.com API for the leaderboard entry of our desired game, category, and placement (first)
    const srBoardResponse = await fetchWithRetry(
        `${SR_BASE_URL}/leaderboards/${gameId}/category/${categoryId}?${srQueryString}`
    );
    if (srBoardResponse === null || !srBoardResponse.ok) {
        console.log("Speedrun.com board request failed, skipping: " + game.name);
        continue;
    }
    const srBoard = await srBoardResponse.json();

    // Build a game object for this particular game and push it to the array of games
    const gameObj = {
        name: srGame.names.international,
        image: `https://images.igdb.com/igdb/image/upload/t_4k/${game.cover.image_id}.jpg`,
        time: srBoard.data.runs[0].run.times.primary_t,
        category: srCategory.name + " " + srFilteredSubcategory[0].values.values[srFilteredSubcategory[0].values.default].label
    }
    games.push(gameObj);

};

fs.writeFileSync("../data/games.json", JSON.stringify(games, null, 2));

// console.log(srFilteredSubcategory[0].values.values[srFilteredSubcategory[0].values.default].label);
// console.log(srGame.names.international + " | " + srCategory.name + " | " + srCategory.id);