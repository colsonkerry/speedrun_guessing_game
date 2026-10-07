import fs from "node:fs";

const games = [];

const SR_BASE_URL = "https://www.speedrun.com/api/v1";

// const id = process.env.TWITCH_CLIENT_ID;
// const secret = process.env.TWITCH_CLIENT_SECRET;

// const response = await fetch(
//     `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
//     { method: "POST" }
// );

// if (!response.ok) {
//     console.log("Token Request Failed:", response.status, await response.text());
//     process.exit(1);
// }

// const data = await response.json();
// const token = data.access_token;

// console.log(`Got token, expires in ${data.expires_in} seconds.`);

const srResponse = await fetch(
    `${SR_BASE_URL}/games?name=${encodeURIComponent("Elden Ring")}&embed=categories,variables`
);
if (!srResponse.ok) {
    console.log("SR Request Failed:", srResponse.status, await srResponse.text());
    process.exit(1);
}
const srData = await srResponse.json();

const srGame = srData.data.find(game => game.names.international === 'Elden Ring');
if (srGame === undefined) {
    console.log("Undefined game, skipping...");
    process.exit(1);
}
const gameId = srGame.id;

const srCategory = srGame.categories.data.find(category => category.type === 'per-game' && !category.miscellaneous);
if (srCategory === undefined) {
    console.log("Undefined category, skipping...");
    process.exit(1);
}
const categoryId = srCategory.id;

const srFilteredSubcategory = srGame.variables.data.filter(subcat => (subcat.category === srCategory.id || subcat.category === null) && subcat["is-subcategory"] === true && (subcat.scope.type === 'full-game' || subcat.scope.type === 'global'));
if (srFilteredSubcategory === undefined) {
    console.log("Undefined subcategory, skipping...");
    process.exit(1);
}

const srUrlFilters = srFilteredSubcategory.map(subcat => `var-${subcat.id}=${subcat.values.default}`);
const srQueryString = "top=1&" + srUrlFilters.join("&");

const srBoardResponse = await fetch(
    `${SR_BASE_URL}/leaderboards/${gameId}/category/${categoryId}?${srQueryString}`
);
if (!srBoardResponse.ok) {
    console.log("SR Board Request Failed:", srBoardResponse.status, await srBoardResponse.text());
    process.exit(1);
}
const srBoard = await srBoardResponse.json();
console.log(srBoard.data.runs[0].run.times.primary_t);

const game = {
    name: srGame.names.international,
    image: "a",
    time: srBoard.data.runs[0].run.times.primary_t,
    category: srCategory.name + " " + srFilteredSubcategory[0].values.values[srFilteredSubcategory[0].values.default].label
}

games.push(game);

fs.writeFileSync("../data/games.json", JSON.stringify(games, null, 2));

console.log(srFilteredSubcategory[0].values.values[srFilteredSubcategory[0].values.default].label);
console.log(srGame.names.international + " | " + srCategory.name + " | " + srCategory.id);