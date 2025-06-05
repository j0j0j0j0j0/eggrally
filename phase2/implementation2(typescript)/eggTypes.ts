import {Schema as S} from "effect"

export const Egg = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
})
export type Egg = typeof Egg.Type

export const Eggnemy = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
    attackDamage: S.Number,
})
export type Eggnemy = typeof Eggnemy.Type

export const Boss = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
    isActive: S.Boolean,
    hasSpawned: S.Boolean,
    attackDamage: S.Number,
})
export type Boss = typeof Boss.Type

export const Entity = S.Union(Egg, Eggnemy, Boss)
export type Entity = typeof Entity.Type

export const Config = S.Struct({
    screenWidth: S.Int,
    screenHeight: S.Int,
    fps: S.Int,
    canvasID: S.String,
    worldWidth: S.Int,
    worldHeight: S.Int,
    eggWidth: S.Int,
    eggHeight: S.Int,
    eggInitialHP: S.Int,
    eggnemyWidth: S.Int,
    eggnemyHeight: S.Int,
    eggnemyInitialHP: S.Int,
    initialNumberOfEggnemies: S.Int,
    eggnemiesToDefeatForBoss: S.Int,
    bossInitialHP: S.Int,
    bossWidth: S.Int,
    bossHeight: S.Int,
})
export type Config = typeof Config.Type
