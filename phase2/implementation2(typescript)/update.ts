import {Match as M} from "effect"
import {CanvasMsg} from "cs12242-mvu/src/canvas"
import {Egg, Eggnemy, Entity, Boss, Config} from "./eggTypes"
import {Model} from "./model"

// helpers
export const attack = (model: Model): [Eggnemy[], number] => {
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
export const move = (egg: Egg, key: string, config: Config):Egg => {
    const speed = 10
    const x = key === "a" ? egg.x - speed : key === "d" ? egg.x + speed : egg.x
    const y = key === "w" ? egg.y - speed : key === "s" ? egg.y + speed : egg.y
    return {
        ...egg,
        x: Math.max(0, Math.min(config.worldWidth - egg.width, x)),
        y: Math.max(0, Math.min(config.worldHeight - egg.height, y)),
    }
}
export const moveToward = (from: Entity, to: Entity, speed = 1): Entity => {
    const diffX = to.x + to.width / 2 - (from.x + from.width / 2)
    const diffY = to.y + to.height / 2 - (from.y + from.height / 2)
    const distance = Math.sqrt(diffX * diffX + diffY * diffY) || 1 
    return {
        ...from,
        x: from.x + (diffX / distance) * speed,
        y: from.y + (diffY / distance) * speed,
    } as Entity
}
export const isColliding = (a: Entity, b: Entity): boolean => (
    a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y
)
export const spawnSingleEggnemy = (config: Config): Eggnemy => {
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
export const spawnBoss = (model: Model): Boss => ({
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

export const Update = (msg: CanvasMsg, model: Model): Model =>
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
            if (boss.hasSpawned && !boss.isActive && boss.currentHP <= 0) {
                return {
                    ...model,
                    egg,
                    eggnemies,
                    boss: { ...boss, currentHP: 0, isActive: false },
                    score,
                    isWon: true
                }
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
