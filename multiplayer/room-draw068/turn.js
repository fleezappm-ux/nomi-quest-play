// Order is chosen once by the host and persisted with the shared round.
export function shufflePlayers(players, random = Math.random) {
 const order = players.map(p => p.uid);
 for (let i = order.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [order[i], order[j]] = [order[j], order[i]];
 }
 return order;
}
export function currentTurn(state, players) {
 const order = state.order ? Object.values(state.order) : players.map(p => p.uid);
 const index = (state.round - 1) % order.length;
 return {order, index, uid: order[index], cycle: Math.floor((state.round - 1) / order.length) + 1};
}
