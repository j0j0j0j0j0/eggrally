import {startModelCmd} from "cs12242-mvu/src"
import {canvasView} from "cs12242-mvu/src/canvas"
import {Eggnemy} from "./eggTypes"
import {Model} from "./model"
import {View} from "./view"
import {Update} from "./update"

const getSettings = async () => {
    const result = await fetch("settings.json") // local settings
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
