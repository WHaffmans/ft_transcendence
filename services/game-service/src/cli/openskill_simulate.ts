
import { defaultRating, updateRatingsOpenSkill } from "../open_skill/index";

const players = [
	defaultRating("alice"),
	defaultRating("bob"),
	defaultRating("carl"),
	defaultRating("dina"),
];

// first out: alice, then bob, then carl, winner: dina
const finishOrder = ["alice", "bob", "carl", "dina"];

const updated = updateRatingsOpenSkill(players, { finishOrder });

console.log("Updated ratings:");
for (const p of updated) {
	console.log(p.id, {
		mu: p.mu.toFixed(3),
		sigma: p.sigma.toFixed(3),
		ordinal: p.ordinal.toFixed(3),
	});
}
