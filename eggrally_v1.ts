import { Cmd, h, startModelCmd } from "cs12242-mvu/src"
import { CanvasMsg, canvasView } from "cs12242-mvu/src/canvas"
import * as Canvas from "cs12242-mvu/src/canvas"
import { Match as M, Schema as S, pipe } from "effect"

// phase 0

const getSettings = async () => {
    const result = await fetch("settings.json")
    //if (!result.ok) throw new Error("Failed to load settings.json") //guards if .json file dont be
    return result.json()
}

const spawnEggnemies = (settings): Eggnemy[] =>
    Array.from({ length: settings.numberOfEggnemies }, () => {
        const maxX = settings.worldWidth - settings.eggnemyWidth
        const maxY = settings.worldHeight - settings.eggnemyHeight

        return {
            x: Math.floor(Math.random() * maxX),
            y: Math.floor(Math.random() * maxY),
            width: settings.eggnemyWidth,
            height: settings.eggnemyHeight,
        }
    })

const attack = (model: Model): Eggnemy[] => 
    model.eggnemies.filter((enem) => 
        !isColliding(model.egg, enem))
    



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
})
type Eggnemy = typeof Eggnemy.Type

const Config = S.Struct({
    screenWidth: S.Int,
    screenHeight: S.Int,
    fps: S.Int,
    canvasID: S.String,
})
type Config = typeof Config.Type

const Model = S.Struct({
    config: Config,
    egg: Egg,
    eggnemies: S.Array(Eggnemy),
    isGameOver: S.Boolean,
    score: S.Int,
    ticks: S.Int,
    lastHit: S.Int,
})
type Model = typeof Model.Type

// UPDATE
type Msg = CanvasMsg

const Update = (msg: Msg, model: Model): Model => 
    M.value(msg).pipe(
        M.tag("Canvas.MsgKeyDown", ({ key }) => {
            if (model.isGameOver) return model

            const [x, y] = move(model, key)

            const newEggnemies = key === "l" ? attack(model) : model.eggnemies

            return {
                ...model,
                egg: {
                    ...model.egg,
                    x,
                    y,
                },
                eggnemies: newEggnemies,
            }
        }),
        M.tag("Canvas.MsgTick", () => {
            const gettingHit = model.eggnemies.some(enem => isColliding(model.egg, enem))
            let newHP =  model.egg.currentHP
            let lastHit = model.lastHit
            if (!model.isGameOver && gettingHit && model.ticks + 1 - model.lastHit >= model.config.fps ) {
                newHP = model.egg.currentHP - 1
                lastHit = model.ticks + 1
            }
            const gameOver = newHP <= 0

            return {
                ...model,
                egg: {
                    ...model.egg,
                    currentHP: newHP,
                },
                eggnemies: gameOver ? model.eggnemies : moveEggnemies(model),
                isGameOver: gameOver,
                ticks: model.ticks + 1,
                lastHit: lastHit,
        }}),
        M.orElse(() => (model))
    )

const move = (model: Model, key: String) => {
    const moveSpeed = 10
    const maxX = model.config.screenWidth - model.egg.width
    const maxY = model.config.screenHeight - model.egg.height

    const x =
        key === "a" || key === "ArrowLeft"
        ? model.egg.x - moveSpeed < 0
            ? model.egg.x
            : model.egg.x - moveSpeed
        : key === "d" || key === "ArrowRight"
            ? model.egg.x + moveSpeed > maxX
            ? model.egg.x
            : model.egg.x + moveSpeed
            : model.egg.x

    const y = 
        key === "w" || key === "ArrowUp"
        ? model.egg.y - moveSpeed < 0
            ? model.egg.y
            : model.egg.y - moveSpeed
        : key === "s" || key === "ArrowDown"
            ? model.egg.y + moveSpeed > maxY
            ? model.egg.y
            : model.egg.y + moveSpeed
            : model.egg.y
    return [x,y]

}

const moveEggnemies = (model: Model): Eggnemy[] => {
    const targetX = model.egg.x + model.egg.width / 2
    const targetY = model.egg.y + model.egg.width / 2

    return model.eggnemies.map(enem => {
        const centerX = enem.x + enem.width /2
        const centerY = enem.y + enem.height / 2

        const diffX = targetX - centerX
        const diffY = targetY - centerY

        return {
            ...enem,
            x: enem.x + diffX / calcD(diffX, diffY),
            y: enem.y + diffY / calcD(diffX, diffY),
        }
    })}

const square = (n: number): number => (n*n)

const calcD = (diffX: number, diffY: number) => {
    const dist = Math.sqrt(square(diffX) + square(diffY))
    return dist === 0 ? 1 : dist
}

const isColliding = (egg: Egg, eggnemy: Eggnemy): boolean => {
    return (
        egg.x < eggnemy.x + eggnemy.width &&
        egg.x + egg.width > eggnemy.x &&
        egg.y < eggnemy.y + eggnemy.height &&
        egg.y + egg.height > eggnemy.y
    )
}

//VIEW
const View = (model: Model) => [
    Canvas.Clear.make({ 
        color: "black"
    }),
    ...(model.egg.currentHP > 0 
        ? [
            Canvas.SolidRectangle.make({
                x: model.egg.x,
                y: model.egg.y,
                width: model.egg.width,
                height: model.egg.height,
                color: "white",
            }),
            Canvas.Text.make({ // egg stats
                x: model.egg.x + model.egg.width / 2 , // center
                y: model.egg.y + model.egg.height + 12,  // below
                text: `${model.egg.currentHP}/${model.egg.maxHP}`,
                fontSize: 12,
                color: "white",
                textAlign: "center",
            }),
        ] : []),
    ...model.eggnemies.map(enem => 
        Canvas.SolidRectangle.make({
            x: enem.x,
            y: enem.y,
            width: enem.width,
            height: enem.height,
            color: "yellow",
    })),
    Canvas.Text.make({
        x: 20,
        y: 20,
        text: "EGGRALLY",
        fontSize: 20,
        color: "white",
        textAlign: "left",
    }),
    Canvas.Text.make({
        x: 20,
        y: 40,
        text: `Score: ${model.score}`,
        fontSize: 16,
        color: "white",
        textAlign: "left",
    }),
]

// START
const root = document.getElementById("app")!

getSettings().then(settings => {
    const initModel: Model = {
        config: {
            screenWidth: settings.worldWidth,
            screenHeight: settings.worldHeight,
            fps: settings.fps,
            canvasID: "canvas",
        },
        egg: {
            x: settings.worldWidth / 2 , // center
            y: settings.worldHeight / 2,
            width: settings.eggWidth,
            height: settings.eggHeight,
            currentHP: settings.eggInitialHP,
            maxHP: settings.eggInitialHP,
        },
        eggnemies: spawnEggnemies(settings),
        isGameOver: false,
        score: 0,
        ticks: 0,
        lastHit: -1000,
    }

    startModelCmd(
        root,
        initModel,
        Update,
        canvasView(
            settings.worldWidth,
            settings.worldHeight,
            settings.fps,
            settings.canvasID,
        View
        )
    )
})
