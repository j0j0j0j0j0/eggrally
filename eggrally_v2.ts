// Phase 1 not done gameover logic succ

import { Cmd, h, startModelCmd } from "cs12242-mvu/src"
import { CanvasMsg, canvasView } from "cs12242-mvu/src/canvas"
import * as Canvas from "cs12242-mvu/src/canvas"
import { Match as M, Schema as S, pipe } from "effect"

// TYPES
const Rectangle = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
})
type Rectangle = typeof Rectangle.Type

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
})
type Eggnemy = typeof Eggnemy.Type

const Boss = S.Struct({
    x: S.Number,
    y: S.Number,
    width: S.Number,
    height: S.Number,
    currentHP: S.Number,
    maxHP: S.Number,
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

const Model = S.Struct({
    config: Config,
    egg: Egg,
    eggnemies: S.Array(Eggnemy),
    boss: S.Union(Boss, S.Null),
    isGameOver: S.Boolean,
    isWon: S.Boolean,
    score: S.Int,
    ticks: S.Int,
    lastHit: S.Int,
})
type Model = typeof Model.Type

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
        }
    })

const attack = (model: Model): [Eggnemy[], Boss | null, number] => {
    let defeated = 0
    const newEggnemies = model.eggnemies.map((enem) => {
        if (isColliding(model.egg, enem)) {
            const newHP = enem.currentHP - 1
            if (newHP <= 0) defeated++
            return { ...enem, currentHP: newHP }
        }
        return enem
    }).filter(enem => enem.currentHP > 0)

    let newBoss = model.boss
    if (!newBoss && model.score + defeated >= model.config.eggnemiesToDefeatForBoss) {
        newBoss = {
            x: Math.random() * model.config.worldWidth,
            y: Math.random() * model.config.worldHeight,
            width: model.config.bossWidth,
            height: model.config.bossHeight,
            currentHP: model.config.bossInitialHP,
            maxHP: model.config.bossInitialHP,
        }
    } else if (newBoss && isColliding(model.egg, newBoss)) {
        newBoss = { ...newBoss, currentHP: newBoss.currentHP - 1 }
        if (newBoss.currentHP <= 0) newBoss = null
    }

    return [newEggnemies, newBoss, defeated]
}

const move = (egg: Egg, key: string, config: Config) => {
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
    const dx = to.x + to.width / 2 - (from.x + from.width / 2)
    const dy = to.y + to.height / 2 - (from.y + from.height / 2)
    const d = Math.sqrt(dx * dx + dy * dy) || 1
    return {
        ...from,
        x: from.x + (dx / d) * speed,
        y: from.y + (dy / d) * speed,
    } as Entity
}

const isColliding = (a: Entity, b: Entity): boolean => (
    a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
)

const Update = (msg: CanvasMsg, model: Model): Model =>
    M.value(msg).pipe(
        M.tag("Canvas.MsgKeyDown", ({ key }) => {
            if (model.isGameOver || model.isWon) return model
            const egg = move(model.egg, key, model.config)
            const [eggnemies, boss, defeated] = key === "l" ? attack({ ...model, egg }) : [model.eggnemies, model.boss, 0]
            const score = model.score + defeated

            return { ...model, egg, eggnemies, boss, score }
        }),
        M.tag("Canvas.MsgTick", () => {
            let egg = model.egg
            let boss = model.boss
            let lastHit = model.lastHit
            let gameOver = model.isGameOver
            let victory = model.isWon

            const canTakeDamage = (model.ticks + 1 - model.lastHit) >= model.config.fps
            if (canTakeDamage) {
                if (boss && isColliding(egg, boss)) {
                    egg = { ...egg, currentHP: egg.currentHP - 3 }
                    lastHit = model.ticks + 1
                } else {
                    for (const enem of model.eggnemies) {
                        if (isColliding(egg, enem)) {
                            egg = { ...egg, currentHP: egg.currentHP - 1 }
                            lastHit = model.ticks + 1
                            break 
                        }
                    }
                }
            }
            if (egg.currentHP <= 0) gameOver = true
            if (boss && boss.currentHP <= 0) victory = true

            const eggnemies = model.eggnemies.map(enem => moveToward(enem, egg) as Eggnemy)
            if (boss && !victory) boss = moveToward(boss, egg, 2) as Boss

            return {
                ...model,
                egg,
                boss,
                eggnemies: gameOver || victory ? model.eggnemies : eggnemies,
                ticks: model.ticks + 1,
                lastHit,
                isGameOver: gameOver,
                isWon: victory,
            }
        }),
        M.orElse(() => model)
    )

const View = (model: Model) => {
    const offsetX = model.egg.x - model.config.screenWidth / 2
    const offsetY = model.egg.y - model.config.screenHeight / 2
    const time = `${Math.floor(model.ticks / model.config.fps / 60)}:${String(Math.floor(model.ticks / model.config.fps) % 60).padStart(2, '0')}`

    const items = [
        Canvas.Clear.make({ color: "black" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: -offsetY, width: model.config.worldWidth, height: 1, color: "white" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: model.config.worldHeight - offsetY, width: model.config.worldWidth, height: 1, color: "white" }),
        Canvas.SolidRectangle.make({ x: -offsetX, y: -offsetY, width: 1, height: model.config.worldHeight, color: "white" }),
        Canvas.SolidRectangle.make({ x: model.config.worldWidth - offsetX, y: -offsetY, width: 1, height: model.config.worldHeight, color: "white" }),
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
            textAlign: "center" }),
        Canvas.Text.make({ x: 50, y: 20, text: `Time: ${time}`, fontSize: 16, color: "white" }),
        Canvas.Text.make({ x: 50, y: 40, text: `Defeated: ${model.score}`, fontSize: 16, color: "white" }),
    ]

    if (model.isWon) {
        items.push(Canvas.Text.make({ x: model.config.screenWidth / 2, y: model.config.screenHeight / 2 - 20, text: "You Win!", fontSize: 20, color: "lime", textAlign: "center" }))
    }

    if (model.isGameOver && !model.isWon) {
        items.push(Canvas.Text.make({ x: model.config.screenWidth / 2, y: model.config.screenHeight / 2 - 20, text: "Game Over", fontSize: 20, color: "red", textAlign: "center" }))
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

    if (model.boss) {
        items.push(Canvas.SolidRectangle.make({ x: model.boss.x - offsetX, y: model.boss.y - offsetY, width: model.boss.width, height: model.boss.height, color: "red" }))
        items.push(Canvas.Text.make({ x: model.boss.x - offsetX, y: model.boss.y - offsetY - 12, text: `${model.boss.currentHP}/${model.boss.maxHP}`, fontSize: 12, color: "red" }))
    }

    return items
}

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
        boss: null,
        isGameOver: false,
        isWon: false,
        score: 0,
        ticks: 0,
        lastHit: -1000,
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
