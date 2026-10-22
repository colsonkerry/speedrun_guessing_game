import fs from "node:fs";

const SR_BASE_URL = "https://www.speedrun.com/api/v1";
const USER_AGENT = "Website for guessing which game has a faster speedrun time (https://github.com/colsonkerry/speedrun_guessing_game)";
const MAX_NEW_PER_RUN = 15;
const REQUEST_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, maxAttempts = 4) {
    let waitMs = 5000;

    const mergedOptions = {
        ...options,
        headers: {
            "User-Agent": USER_AGENT,
            ...options.headers,
        }
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch(url, mergedOptions);

        if (response.status !== 429 && response.status !== 420) {
            await sleep(REQUEST_DELAY_MS);
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

let games = [];
let skippedGames = [];
let gamesToAdd = [];
let igdbGamesResponse;

try {
    if (fs.existsSync("../data/games.json")) {
        const gameArray = JSON.parse(fs.readFileSync("../data/games.json", "utf8"));
        games = gameArray;
    } else {
        games = [];
    } 
} catch (error) {
    console.error("An error occurred: ", error.message);
}
try {
    if (fs.existsSync("../tools/skipped-games.json")) {
        const skippedGamesArray = JSON.parse(fs.readFileSync("../tools/skipped-games.json", "utf8"));
        skippedGames = skippedGamesArray;
    } else {
        skippedGames = [];
    } 
} catch (error) {
    console.error("An error occurred: ", error.message);
}
try {
    if (fs.existsSync("../tools/games-to-add.json")) {
        const gamesToAddArray = JSON.parse(fs.readFileSync("../tools/games-to-add.json", "utf8"));
        gamesToAdd = gamesToAddArray;
    } else {
        gamesToAdd = [];
    } 
} catch (error) {
    console.error("An error occurred: ", error.message);
}

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

if (gamesToAdd.length > 0) {
    igdbGamesResponse = await fetch(
        `https://api.igdb.com/v4/games`, {
        method: "POST",
        headers: {
            "Client-ID": `${id}`,
            "Authorization": `Bearer ${token}`
        },
        body: `fields name, cover.image_id; limit 3; search "${gamesToAdd[0]}";`
    })
    if (!igdbGamesResponse.ok) {
    console.log("IGDB Games Request Failed For Specific Search:", igdbGamesResponse.status, await igdbGamesResponse.text());
    process.exit(1);
    }
}
else {
    igdbGamesResponse = await fetch(
    `https://api.igdb.com/v4/games`, { 
    method: "POST",
        headers: {
            "Client-ID": `${id}`,
            "Authorization": `Bearer ${token}`
        },
        body: "fields name, cover.image_id; limit 200; sort total_rating_count desc;"
    })
    if (!igdbGamesResponse.ok) {
        console.log("IGDB Games Request Failed:", igdbGamesResponse.status, await igdbGamesResponse.text());
        process.exit(1);
    }
}

const igdbGames = await igdbGamesResponse.json();
let newGames = 0;


for (const game of igdbGames) {
    if (newGames >= MAX_NEW_PER_RUN) {
        break;
    }

    // Convert game name to a standardized form (lowercase, "and" and not &, stripped accent marks, delete spaces/colons/hyphens/apostrophes)
    const igdbGameName = standardizeName(game.name);

    // Check if game should be skipped
    if (skippedGames.some(skippedGameEntry => standardizeName(skippedGameEntry) === standardizeName(game.name))) {
        console.log("Already skipping game:", game.name);
        continue;
    }
    if (games.some(gameEntry => gameEntry.igdbId === game.id)) {
        console.log("Already have game:", game.name);
        continue;
    }
    if (!game.cover || !game.cover.image_id || game.cover.image_id.length === 0) {
        console.log("game.cover.image.id is empty, skipping:", game.name);
        skippedGames.push(game.name);
        continue;
    }

    // ---SPEEDRUN.COM API---

    // Initial Speedrun.com fetch
    const srResponse = await fetchWithRetry(
        `${SR_BASE_URL}/games?name=${encodeURIComponent(`${game.name}`)}&embed=categories,variables`
    );
    if (srResponse === null || !srResponse.ok) {
        console.log("Speedrun.com request failed");
        continue;
    };
    // Parse response of specific game into srData which is an array of all games partially matching the given name.
    // i.e. 'Grand Theft Auto V' returns 'gtav', 'gtavcs_remastered', etc.. 
    const srData = await srResponse.json();
    newGames++;

    // Take that data and find() the entry whose name matches exactly
    const srGame = srData.data.find(gameEntry => standardizeName(gameEntry.names.international) === igdbGameName);
    if (srGame === undefined) {
        console.log("Undefined game, skipping: " + game.name + ", game.id: " + game.id + ", game.cover.image_id: " + game.cover.image_id);
        skippedGames.push(game.name);
        continue;
    }
    // Store the id value of that game (i.e. Grand Theft Auto V -> id: om1mx362)
    const gameId = srGame.id;

    // Go through the categories of the given game and return the first one that covers
    // the entire game and isn't miscellaneous (hopefully the most popular entry)
    const srCategory = srGame.categories.data.find(category => category.type === 'per-game' && !category.miscellaneous);
    if (srCategory === undefined) {
        console.log("Undefined category, skipping: " + game.name + " " + gameId);
        skippedGames.push(game.name);
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
    const srQueryString = "top=1&" + srUrlFilters.join("&");
    console.log(`${SR_BASE_URL}/leaderboards/${gameId}/category/${categoryId}?${srQueryString}`);

    // Call the Speedrun.com API for the leaderboard entry of our desired game, category, and placement (first)
    const srBoardResponse = await fetchWithRetry(
        `${SR_BASE_URL}/leaderboards/${gameId}/category/${categoryId}?${srQueryString}`
    );
    if (srBoardResponse === null || !srBoardResponse.ok) {
        console.log("Speedrun.com leaderboard request failed: [" + game.name, gameId + "]");
        continue;
    }
    const srBoard = await srBoardResponse.json();

    if (srBoard.data.runs.length === 0) {
        console.log("srBoard.data.runs is empty, skipping:", game.name, gameId);
        skippedGames.push(game.name);
        continue;
    }


    const srSubcategoryLabels = srFilteredSubcategory.map((subcat) => subcat.values.values[subcat.values.default]?.label).filter(Boolean);
    const srCategoryLabel = srSubcategoryLabels.length > 0 ? `${srCategory.name} (${srSubcategoryLabels.join(", ")})` : srCategory.name;

    // Build a game object for this particular game and push it to the array of games
    const gameObj = {
        name: srGame.names.international,
        image: `https://images.igdb.com/igdb/image/upload/t_4k/${game.cover.image_id}.jpg`,
        time: srBoard.data.runs[0].run.times.primary_t,
        formattedTime: formatTime(srBoard.data.runs[0].run.times.primary_t),
        category: srCategoryLabel,
        srId: gameId,
        igdbId: game.id,
        srLink: srGame.weblink
    }
    games.push(gameObj);
    fs.writeFileSync("../data/games.json", JSON.stringify(games, null, 2));
    fs.writeFileSync("../tools/skipped-games.json", JSON.stringify(skippedGames, null, 2));
    gamesToAdd.shift();
    fs.writeFileSync('../tools/games-to-add.json', JSON.stringify(gamesToAdd, null, 2));
};

fs.writeFileSync("../data/games.json", JSON.stringify(games, null, 2));

// Convert game name to a standardized form (lowercase, "and" and not &, stripped accent marks, delete spaces/colons/hyphens/apostrophes)
function standardizeName(gameName) {
    return (gameName.toLowerCase()).replaceAll("&", "and").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[ :'-]/g, "")
}

function formatTime(gameTime) {
    const hours = Math.floor(gameTime / 3600);
    const minutes = Math.floor((gameTime % 3600) / 60);
    const seconds = Math.floor(gameTime % 60);

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
}

// console.log(srFilteredSubcategory[0].values.values[srFilteredSubcategory[0].values.default].label);
// console.log(srGame.names.international + " | " + srCategory.name + " | " + srCategory.id);