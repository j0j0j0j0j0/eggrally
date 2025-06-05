import json
import random
from egg_types import PyxelColors, Egg, Eggnemy, Config 
from model import EggModel
from view import EggView
from controller import EggController

#phase 2
if __name__ == "__main__":
    with open("settings.json") as f: #local settings
        s = json.load(f)

    config = Config( # hardcoded speeds and colors for now to work with ts
        screen_width = s["screenWidth"],
        screen_height = s["screenHeight"],
        world_width = s["worldWidth"],
        world_height = s["worldHeight"],
        fps = s["fps"],
        egg_width = s["eggWidth"],
        egg_height = s["eggHeight"],
        egg_init_hp = s["eggInitialHP"],
        egg_speed = 3,
        egg_color = PyxelColors.WHITE,
        eggnemy_width = s["eggnemyWidth"],
        eggnemy_height = s["eggnemyHeight"],
        eggnemy_init_hp = s["eggnemyInitialHP"],
        init_eggnemy_count = s["initialNumberOfEggnemies"],
        eggnemies_to_defeat_for_boss = s["eggnemiesToDefeatForBoss"],
        eggnemy_speed = 1,
        eggnemy_color = PyxelColors.YELLOW,
        boss_width = s["bossWidth"],
        boss_height = s["bossHeight"],
        boss_init_hp = s["bossInitialHP"],
        boss_speed = 2,
        boss_color = PyxelColors.RED,
    )

    egg = Egg(
        x = config.world_width // 2,
        y = config.world_height // 2,
        width = config.egg_width,
        height = config.egg_height,
        current_hp = config.egg_init_hp,
        max_hp = config.egg_init_hp,
        color = config.egg_color
    )

    enemies = [
        Eggnemy(
            x = random.randint(0, config.world_width - config.eggnemy_width),
            y = random.randint(0, config.world_height - config.eggnemy_height),
            width = config.eggnemy_width,
            height = config.eggnemy_height,
            color = config.eggnemy_color,
            current_hp = config.eggnemy_init_hp,
            max_hp = config.eggnemy_init_hp
        )
        for _ in range(config.init_eggnemy_count)
    ]

    model = EggModel(config, egg, enemies)
    view = EggView(config.screen_width, config.screen_height)
    controller = EggController(model, view)
    controller.start()
