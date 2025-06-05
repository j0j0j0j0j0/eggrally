import { describe, it, expect } from "vitest"
import { attack, move, moveToward, isColliding, spawnSingleEggnemy, spawnBoss } from "./update"
import { Eggnemy, Entity, Boss } from "./eggTypes"
import { Model } from "./model"
import { Update } from "./update"

//21 tests so far
const config = {
    screenWidth: 100,
    screenHeight: 100,
    canvasID: "canvas",
    fps: 60,
    worldWidth: 200,
    worldHeight: 200,
    eggWidth: 20,
    eggHeight: 20,
    eggInitialHP: 10,
    eggnemyWidth: 20,
    eggnemyHeight: 20,
    eggnemyInitialHP: 1,
    initialNumberOfEggnemies: 0,
    eggnemiesToDefeatForBoss: 3,
    bossInitialHP: 5,
    bossWidth: 20,
    bossHeight: 20,
}

const egg = {
    x: 50,
    y: 50,
    width: config.eggWidth,
    height: config.eggHeight,
    currentHP: config.eggInitialHP,
    maxHP: config.eggInitialHP,
}

const baseModel: Model = {
    egg,
    eggnemies: [],
    boss: {
        x: 0,
        y: 0,
        width: config.bossWidth,
        height: config.bossHeight,
        currentHP: config.bossInitialHP,
        maxHP: config.bossInitialHP,
        isActive: false,
        hasSpawned: false,
        attackDamage: 3,
    },
    config,
    isGameOver: false,
    isWon: false,
    score: 0,
    ticks: 0,
    lastHit: -1000,
    nextSpawn: 9999,
}

const createEggnemy = (x: number, y: number): Eggnemy => ({
    x,
    y,
    width: 20,
    height: 20,
    currentHP: 1,
    maxHP: 1,
    attackDamage: 1
})

describe("helper function", () => {
    it("should defeat eggnemy and increase defeated count when attacking", () => {
        const enemy = createEggnemy(egg.x, egg.y)
        const model = { ...baseModel, eggnemies: [enemy] }
        const [newEnemies, defeated] = attack(model)
        expect(newEnemies.length).toBe(0)
        expect(defeated).toBe(1)
    })

    it("should reduce enemy HP when attacking", () => {
        const enemy = { ...createEggnemy(egg.x, egg.y), currentHP: 2 }
        const model = { ...baseModel, eggnemies: [enemy] }
        const [newEnemies, defeated] = attack(model)
        expect(newEnemies.length).toBe(1)
        expect(newEnemies[0].currentHP).toBe(1)
        expect(defeated).toBe(0)
    })

    it("should move entity closer to target", () => {
        const from: Entity = { x: 0, y: 0, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        const to: Entity = { x: 10, y: 10, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        const moved = moveToward(from, to, 2)
        const distance = (a: Entity, b: Entity) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
        const oldDistance = distance(from, to)
        const newDistance = distance(moved, to)
        expect(moved.x).toBeGreaterThan(from.x)
        expect(moved.y).toBeGreaterThan(from.y)
        expect(newDistance).toBeLessThan(oldDistance)
    })

    it("returns isColliding as true for overlapping entities", () => {
        const a: Entity = { x: 0, y: 0, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        const b: Entity = { x: 5, y: 5, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        expect(isColliding(a, b)).toBe(true)
    })

    it("returns isColliding as false for nonoverlapping entities", () => {
        const a: Entity = { x: 0, y: 0, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        const b: Entity = { x: 20, y: 20, width: 10, height: 10, currentHP: 1, maxHP: 1 }
        expect(isColliding(a, b)).toBe(false)
    })

    it("returns a new eggnemy inside world bounds", () => {
        const e = spawnSingleEggnemy(config)
        expect(e.x + e.width).toBeLessThanOrEqual(config.worldWidth)
        expect(e.y + e.height).toBeLessThanOrEqual(config.worldHeight)
    })

    it("initializes boss with correct HP and position", () => {
        const boss = spawnBoss(baseModel)
        expect(boss.currentHP).toBe(config.bossInitialHP)
        expect(boss.isActive).toBe(true)
        expect(boss.hasSpawned).toBe(true)
        expect(boss.x + boss.width).toBeLessThanOrEqual(config.worldWidth)
        expect(boss.y + boss.height).toBeLessThanOrEqual(config.worldHeight)
    })
})

describe("move with WASD", () => {
    it("moves right with d", () => {
        const moved = move(egg, "d", config)
        expect(moved.x).toBeGreaterThan(egg.x)
        expect(moved.y).toBe(egg.y)
    })

    it("moves left with a", () => {
        const moved = move(egg, "a", config)
        expect(moved.x).toBeLessThan(egg.x)
        expect(moved.y).toBe(egg.y)
    })

    it("moves up with w", () => {
        const moved = move(egg, "w", config)
        expect(moved.y).toBeLessThan(egg.y)
        expect(moved.x).toBe(egg.x)
    })

    it("moves down with s", () => {
        const moved = move(egg, "s", config)
        expect(moved.y).toBeGreaterThan(egg.y)
        expect(moved.x).toBe(egg.x)
    })

    it("does not move left past 0", () => {
        const edgeEgg = { ...egg, x: 0 }
        const moved = move(edgeEgg, "a", config)
        expect(moved.x).toBeGreaterThanOrEqual(0)
    })

    it("does not move up past 0", () => {
        const edgeEgg = { ...egg, y: 0 }
        const moved = move(edgeEgg, "w", config)
        expect(moved.y).toBeGreaterThanOrEqual(0)
    })

    it("does not move right past worldWidth", () => {
        const edgeEgg = { ...egg, x: config.worldWidth - egg.width }
        const moved = move(edgeEgg, "d", config)
        expect(moved.x + egg.width).toBeLessThanOrEqual(config.worldWidth)
    })

    it("does not move down past worldHeight", () => {
        const edgeEgg = { ...egg, y: config.worldHeight - egg.height }
        const moved = move(edgeEgg, "s", config)
        expect(moved.y + egg.height).toBeLessThanOrEqual(config.worldHeight)
    })
})

describe("Updates", () => {
    it("defeats nearby eggnemy when l is pressed", () => {
        const egg = { ...baseModel.egg, x: 50, y: 50 }
        const eggnemy = { ...createEggnemy(50, 50), currentHP: 1 }
        const model = { ...baseModel, egg, eggnemies: [eggnemy], score: 0 }

        const updated = Update({ _tag: "Canvas.MsgKeyDown", key: "l" }, model)

        expect(updated.eggnemies.length).toBe(0)
        expect(updated.score).toBe(1)
    })

    it("spawns boss when score is reached", () => {
        const egg = { ...baseModel.egg, x: 50, y: 50 }
        const eggnemy = { ...createEggnemy(50, 50), currentHP: 1 }
        const model = {
        ...baseModel,
        egg,
        eggnemies: [eggnemy],
        score: config.eggnemiesToDefeatForBoss - 1,
        boss: { ...baseModel.boss, isActive: false, hasSpawned: false }
        }

        const updated = Update({ _tag: "Canvas.MsgKeyDown", key: "l" }, model)

        expect(updated.boss.hasSpawned).toBe(true)
        expect(updated.boss.isActive).toBe(true)
    })

    it("damages egg from colliding eggnemy", () => {
        const egg = { ...baseModel.egg, x: 100, y: 100, currentHP: 10 }
        const enemy = createEggnemy(100, 100)
        const model = {
        ...baseModel,
        egg,
        eggnemies: [enemy],
        lastHit: 0,
        ticks: config.fps
        }

        const updated = Update({ _tag: "Canvas.MsgTick" }, model)

        expect(updated.egg.currentHP).toBeLessThan(egg.currentHP)
        expect(updated.lastHit).toBeGreaterThan(model.lastHit)
    })

    it("damages egg from colliding boss", () => {
        const egg = { ...baseModel.egg, x: 50, y: 50, currentHP: 10 }
        const boss = { ...baseModel.boss, x: 50, y: 50, isActive: true, hasSpawned: true }
        const model = { ...baseModel, egg, boss, ticks: config.fps }

        const updated = Update({ _tag: "Canvas.MsgTick" }, model)
        expect(updated.egg.currentHP).toBeLessThan(egg.currentHP)
    })

    it("ends game if egg is defeated", () => {
        const egg = { ...baseModel.egg, currentHP: 0 }
        const model = { ...baseModel, egg }

        const updated = Update({ _tag: "Canvas.MsgTick" }, model)

        expect(updated.isGameOver).toBe(true)
    })

    it("wins when boss is defeated", () => {
        const egg = { ...baseModel.egg, x: 50, y: 50 }
        const boss = {...baseModel.boss, x: 50, y: 50, isActive: true, hasSpawned: true, currentHP: 1 }
        const model = {...baseModel,egg,boss}
        const updated = Update({ _tag: "Canvas.MsgKeyDown", key: "l" }, model)
        expect(updated.boss.currentHP).toBe(0)
        expect(updated.isWon).toBe(true)
    })
})
