import * as Canvas from "cs12242-mvu/src/canvas"
import {Model} from "./model"

export const View = (model: Model) => {
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
