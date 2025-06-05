import {Schema as S} from "effect"
import {Egg, Eggnemy, Boss, Config} from "./eggTypes"

export type Model = typeof Model.Type
export const Model = S.Struct({
    config: Config,
    egg: Egg,
    eggnemies: S.Array(Eggnemy),
    boss: Boss,
    isGameOver: S.Boolean,
    isWon: S.Boolean,
    score: S.Int,
    ticks: S.Int,
    lastHit: S.Int,
    nextSpawn: S.Int,
})
