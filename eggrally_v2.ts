// Phase 1

import { Cmd, h, startModelCmd } from "cs12242-mvu/src"
import { CanvasMsg, canvasView } from "cs12242-mvu/src/canvas"
import * as Canvas from "cs12242-mvu/src/canvas"
import { Match as M, Schema as S, pipe } from "effect"

// TYPES
const Egg = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
})
type Egg = typeof Egg.Type

const Eggnemy = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
    attackDamage: S.Number,
})
type Eggnemy = typeof Eggnemy.Type

const Boss = S.Struct({
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
type Boss = typeof Boss.Type

const Entity = S.Union(Egg, Eggnemy, Boss)
type Entity = typeof Entity.Type

const Config = S.Struct({
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
type Config = typeof Config.Type

// HELPERS
const getCenter = (e: Entity) => ({
    x: e.x + e.width / 2,
    y: e.y + e.height / 2,
})

const getBounds = (e: Entity) => ({
    top: e.y,
    bottom: e.y + e.height,
    left: e.x,
    right: e.x + e.width,
})

const getSettings = async () => {
    const result = await fetch("settings1.json")
    return result.json()
}

const spawnEggnemies = (settings): Eggnemy[] =>
    Array.from({ length: settings.initialNumberOfEggnemies }, () => {
        const maxX = settings.worldWidth - settings.eggnemyWidth
        const maxY = settings.worldHeight - settings.eggnemyHeight

        return {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY),
            width: settings.eggnemyWidth,
            height: settings.eggnemyHeight,
            currentHP: settings.eggnemyInitialHP,
            maxHP: settings.eggnemyInitialHP,
            attackDamage: 1, // hardcoded
        }
    })

const spawnSingleEggnemy = (config: Config): Eggnemy => {
    const maxX = config.worldWidth - config.eggnemyWidth
    const maxY = config.worldHeight - config.eggnemyHeight
    return {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY),
        width: config.eggnemyWidth,
        height: config.eggnemyHeight,
        currentHP: config.eggnemyInitialHP,
        maxHP: config.eggnemyInitialHP,
        attackDamage: 1,
    }
}

const spawnBoss = (model: Model): Boss => ({
    x: Math.random() * model.config.worldWidth,
    y: Math.random() * model.config.worldHeight,
    width: model.config.bossWidth,
    height: model.config.bossHeight,
    currentHP: model.config.bossInitialHP,
    maxHP: model.config.bossInitialHP,
    isActive: true,
    hasSpawned: true,
    attackDamage: 3,
})
const attack = (model: Model): [Eggnemy[], number] => {
    let defeated: number = 0
    const newEggnemies = model.eggnemies.map((enem) => {
        if (isColliding(model.egg, enem)) {
            const newHP = enem.currentHP - 1
            if (newHP <= 0) defeated++
            return { ...enem, currentHP: newHP }
        }
        return enem
    }).filter(enem => enem.currentHP > 0)

    return [newEggnemies, defeated]
}

const move = (egg: Egg, key: string, config: Config):Egg => {
    const speed = 10
    const x = key === "a" ? egg.x - speed : key === "d" ? egg.x + speed : egg.x
    const y = key === "w" ? egg.y - speed : key === "s" ? egg.y + speed : egg.y
    return {
        ...egg,
        x: Math.max(0, Math.min(config.worldWidth - egg.width, x)),
        y: Math.max(0, Math.min(config.worldHeight - egg.height, y)),
    }
}

const moveToward = (from: Entity, to: Entity, speed = 1): Entity => {
    const diffX = to.x + to.width / 2 - (from.x + from.width / 2)
    const diffY = to.y + to.height / 2 - (from.y + from.height / 2)
    const distance = Math.sqrt(diffX * diffX + diffY * diffY) || 1 
    return {
        ...from,
        x: from.x + (diffX / distance) * speed,
        y: from.y + (diffY / distance) * speed,
    } as Entity
}

const isColliding = (a: Entity, b: Entity): boolean => (
    a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
)

// MVU
type Model = typeof Model.Type
const Model = S.Struct({
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

const View = (model: Model) => {
    const offsetX = model.egg.x + model.egg.width / 2 - model.config.screenWidth / 2 // rel to egg center
    const offsetY = model.egg.y + model.egg.height / 2 - model.config.screenHeight / 2 
    const time = `${Math.floor(model.ticks / model.config.fps / 60)}:${String(Math.floor(model.ticks / model.config.fps) % 60).padStart(2, '0')}`

    const items = [
        Canvas.Clear.make({ color: "black" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: -offsetY, width: model.config.worldWidth, height: 1, color: "white" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: model.config.worldHeight - offsetY, width: model.config.worldWidth, height: 1, color: "white" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: -offsetY, width: 1, height: model.config.worldHeight, color: "white" }),
        Canvas.SolidRectangle.make({ x: model.config.worldWidth - offsetX, y: -offsetY, width: 1, height: model.config.worldHeight, color: "white" }),
        ...(model.isGameOver? [] : [
            Canvas.SolidRectangle.make({ 
                x: model.config.screenWidth / 2 - model.egg.width / 2, 
                y: model.config.screenHeight / 2 - model.egg.height / 2,
                width: model.egg.width, 
                height: model.egg.height, 
                color: "white" }),
            Canvas.Text.make({ 
                x: model.config.screenWidth / 2, 
                y: model.config.screenHeight / 2  + model.egg.height / 2 + 12, 
                text: `${model.egg.currentHP}/${model.egg.maxHP}`, 
                fontSize: 12, color: "white", 
                textAlign: "center" })]),
        Canvas.Text.make({ x: 50, y: 20, text: `Time: ${time}`, fontSize: 16, color: "white" }),
        Canvas.Text.make({ x: 50, y: 40, text: `Defeated: ${model.score}`, fontSize: 16, color: "white" }),
    ]

    if (model.isWon && model.boss.hasSpawned && !model.isGameOver) {
        items.push(Canvas.Text.make({ x: model.config.screenWidth / 2, y: model.config.screenHeight / 2 - model.egg.height, text: "You Win!", fontSize: 20, color: "white", textAlign: "center" }))
    }

    if (model.isGameOver && !model.isWon) {
        items.push(Canvas.Clear.make({color: "black"}))
        items.push(Canvas.Text.make({ x: model.config.screenWidth / 2, y: model.config.screenHeight / 2 - model.egg.height, text: "Game Over", fontSize: 20, color: "white", textAlign: "center" }))
    }

    for (const enem of model.eggnemies) {
    items.push(Canvas.SolidRectangle.make({
        x: enem.x - offsetX,
        y: enem.y - offsetY,
        width: enem.width,
        height: enem.height,
        color: "yellow",
    }))
    items.push(Canvas.Text.make({
        x: enem.x - offsetX + enem.width / 2,
        y: enem.y - offsetY + enem.height + 12,
        text: `${enem.currentHP}/${enem.maxHP}`,
        fontSize: 12,
        color: "yellow",
        textAlign: "center",
    }))
}

    if (model.boss.isActive) {
        items.push(Canvas.SolidRectangle.make({ x: model.boss.x - offsetX, y: model.boss.y - offsetY, width: model.boss.width, height: model.boss.height, color: "red" }))
        items.push(Canvas.Text.make({ x: model.boss.x - offsetX, y: model.boss.y - offsetY - 12, text: `${model.boss.currentHP}/${model.boss.maxHP}`, fontSize: 12, color: "red" }))
    }

    return items
}

const Update = (msg: CanvasMsg, model: Model): Model =>
    M.value(msg).pipe(
        M.tag("Canvas.MsgKeyDown", ({ key }) => {
            if (model.isGameOver || model.isWon) return model

            const egg = move(model.egg, key, model.config)
            let boss = model.boss
            let defeated = 0
            let eggnemies = model.eggnemies
            let score = model.score

            if (key === "l") {
                [eggnemies, defeated] = attack({ ...model, egg })
                score += defeated
            }

            if (!boss.hasSpawned && !boss.isActive && score >= model.config.eggnemiesToDefeatForBoss) {
                boss = spawnBoss(model)
            }

            if (boss.isActive && key === "l" && isColliding(egg, boss)) {
                const newHP = boss.currentHP - 1
                boss = { ...boss, currentHP: newHP, isActive: newHP > 0 }
            }

            return { ...model, egg, eggnemies, boss, score }
        }),

        M.tag("Canvas.MsgTick", () => {
            if (model.isGameOver || model.isWon) return model

            let egg = model.egg
            let eggnemies = model.eggnemies
            let boss = model.boss
            let lastHit = model.lastHit
            let nextSpawn = model.nextSpawn - 1

            const canTakeDamage = (model.ticks + 1 - model.lastHit) >= model.config.fps
            if (canTakeDamage) {
                if (boss.isActive && isColliding(egg, boss)) {
                    egg = { ...egg, currentHP: egg.currentHP - boss.attackDamage }
                    lastHit = model.ticks + 1
                } 
                else {
                    for (const enem of model.eggnemies) {
                        if (isColliding(egg, enem)) {
                            egg = { ...egg, currentHP: egg.currentHP - enem.attackDamage }
                            lastHit = model.ticks + 1
                            break
                        }
                    }
                }
            }
            if (nextSpawn <= 0) {
                eggnemies = [...eggnemies, spawnSingleEggnemy(model.config)]
                nextSpawn = Math.floor(Math.random() * model.config.fps * 7) + 3 + model.config.fps // 3 to 10 seconds
            }
            console.log("Spawning new eggnemy at tick:", model.nextSpawn)
            const gameOver = egg.currentHP <= 0
            const victory = boss.hasSpawned && !boss.isActive && boss.currentHP <= 0

            if (gameOver || victory) {
                return {
                    ...model,
                    egg,
                    boss: victory ? { ...boss, isActive: false } : boss,
                    lastHit,
                    ticks: model.ticks + 1,
                    isGameOver: gameOver,
                    isWon: victory,
                    nextSpawn,
                    eggnemies,
                }
            }

            eggnemies = eggnemies.map(enem => moveToward(enem, egg) as Eggnemy)
            if (boss.isActive) boss = moveToward(boss, egg, 2) as Boss // faster

            return {
                ...model,
                egg,
                boss,
                eggnemies,
                lastHit,
                ticks: model.ticks + 1,
                isGameOver: gameOver,
                isWon: victory,
                nextSpawn,
            }
        }),

        M.orElse(() => model)
    )

// START
const root = document.getElementById("app")!

getSettings().then(settings => {
    const initModel: Model = {
        config: { ...settings, canvasID: "canvas" },
        egg: {
            x: (settings.worldWidth / 2) - settings.eggWidth / 2,
            y: (settings.worldHeight / 2) - settings.eggHeight / 2,
            width: settings.eggWidth,
            height: settings.eggHeight,
            currentHP: settings.eggInitialHP,
            maxHP: settings.eggInitialHP,
        },
        eggnemies: spawnEggnemies(settings),
        boss: {
            x: 0,
            y: 0,
            width: settings.bossWidth,
            height: settings.bossHeight,
            currentHP: 0,
            maxHP: settings.bossInitialHP,
            isActive: false,
            hasSpawned: false,
            attackDamage: 3, // hardcoded
        },
        isGameOver: false,
        isWon: false,
        score: 0,
        ticks: 0,
        lastHit: -1000,
        nextSpawn: Math.floor(Math.random() * settings.fps * 7) + 3 + settings.fps, // 3 to 10s delay

    }

    startModelCmd(
        root,
        initModel,
        Update,
        canvasView(
            settings.screenWidth,
            settings.screenHeight,
            settings.fps,
            settings.canvasID,
            View
        )
    )
})
