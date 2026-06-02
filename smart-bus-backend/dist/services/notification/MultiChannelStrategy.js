"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiChannelStrategy = void 0;
class MultiChannelStrategy {
    constructor(strategies) {
        this.strategies = strategies;
    }
    async send(userId, title, message) {
        // Execute all strategies concurrently
        await Promise.all(this.strategies.map(strategy => strategy.send(userId, title, message)));
    }
}
exports.MultiChannelStrategy = MultiChannelStrategy;
