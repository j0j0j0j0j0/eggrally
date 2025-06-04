import pyxel
import json
import math
import random
from dataclasses import dataclass
from typing import Callable

#phase 0

@dataclass
class Rectangle:
    x: float
    y: float
    width: int
    height: int
    color: int

    @property
    def top(self): return self.y
    @property
    def bottom(self): return self.y + self.height
    @property
    def left(self): return self.x
    @property
    def right(self): return self.x + self.width
    @property
    def midx(self): return self.x + self.width // 2
    @property
    def midy(self): return self.y + self.height // 2

@dataclass
class Egg(Rectangle):
    current_hp: int
    max_hp: int

    # @property
    # def current_hp(self): return self.current_hp

    def move(self, speed: int):
        if pyxel.btn(pyxel.KEY_W):
            self.y -= speed
        if pyxel.btn(pyxel.KEY_S):
            self.y += speed
        if pyxel.btn(pyxel.KEY_A):
            self.x -= speed
        if pyxel.btn(pyxel.KEY_D):
            self.x += speed
        self.x = max(0, min(self.x, pyxel.width - self.width))
        self.y = max(0, min(self.y, pyxel.height - self.height))

@dataclass
class Eggnemy(Rectangle):
    def move_towards(self, egg: Egg, speed:int):
        target_x = egg.x + egg.midx
        target_y = egg.y + egg.midy

        center_x = self.x + self.midx
        center_y = self.y + self.midy

        diff_x = target_x - center_x
        diff_y = target_y - center_y

        distance = math.sqrt( diff_x**2 + diff_y**2)

        self.x += diff_x / distance * speed
        self.y += diff_y / distance * speed

@dataclass
class Config:
    screen_width: int
    screen_height: int 
    fps: int
    eggnemy_count: int
    egg_speed: int = 5
    eggnemy_speed: int = 2
    egg_color: int = 7 #white
    eggnemy_color: int = 8 # red

# MODELL
class Model:
    def __init__(self, config: Config, egg: Egg, eggnemies: list[Eggnemy]):
        self._config: Config = config
        self._egg: Egg = egg
        self._eggnemies: list[Eggnemy] = eggnemies
        self._is_game_over: bool = False
        self._score: int = 0
        self._ticks: int = 0
        self._last_hit: int = -1000

    def update(self):
        if self._is_game_over:
            return

        self._ticks += 1
        egg_speed = self._config.egg_speed
        eggnemy_speed = self._config.eggnemy_speed
        self._egg.move(egg_speed)

        for enem in self._eggnemies:
            enem.move_towards(self._egg, eggnemy_speed)

            if self._is_colliding(self._egg, enem):
                if self._ticks - self._last_hit >= self._config.fps: 
                    self._egg.current_hp -= 1
                    self._last_hit = self._ticks

                    if self._egg.current_hp <= 0:
                        self._is_game_over = True
                        break
        
        if pyxel.btn(pyxel.KEY_L):
            self._attack()

    def _is_colliding(self, rect1: Rectangle, rect2: Rectangle):
        return not (
            rect1.right < rect2.left or
            rect1.left > rect2.right or
            rect1.bottom < rect2.top or
            rect1.top > rect2.bottom
        )

    def _attack(self):
        attack_range = 50  # hard coded
        target_x = self._egg.midx
        target_y = self._egg.midy

        remaining_enemies: list[Eggnemy] = []
        for enem in self._eggnemies:
            enem_center_x = enem.midx
            enem_center_y = enem.midy

            distance = math.sqrt((enem_center_x - target_x) ** 2 + (enem_center_y - target_y) ** 2)
            
            if distance > attack_range:
                remaining_enemies.append(enem)
            else:
                self._score += 1

        self._eggnemies = remaining_enemies

    @property
    def egg_width(self):
        return self._egg.width
 
    @property
    def egg_height(self):
        return self._egg.height
 
    @property
    def fps(self):
        return self._config.fps

    @property
    def egg(self) -> Egg:
        return self._egg
    
    @property
    def eggnemies(self) -> list[Eggnemy]:
        return self._eggnemies
    
    @property
    def score(self) -> int:
        return self._score
 
    @property
    def is_game_over(self) -> bool:
        return self._is_game_over
        
#VIEW
class View:
    def __init__(self, width: int, height: int):
        self._screen_width: int = width
        self._screen_height: int = height

    def start(self, update: Callable[[], None], draw: Callable[[], None], fps:int):
        pyxel.init(self._screen_width, self._screen_height, fps=fps)
        pyxel.run(update, draw)
    
    def clear_screen(self):
        pyxel.cls(0)

    def draw_egg(self, egg: Egg):
        pyxel.rect(egg.x, egg.y, egg.width, egg.height, egg.color) 
    
    def draw_eggnemy(self, eggnemy: Eggnemy):
        pyxel.rect(eggnemy.x, eggnemy.y, eggnemy.width, eggnemy.height, eggnemy.color)  #red

    def draw_egg_current_hp(self, egg: Egg):
        pyxel.text(egg.midx - 5, egg.bottom + 5, f"{str(egg.current_hp)}/{str(egg.max_hp)}", egg.color)

    def draw_score(self, score: int):
        pyxel.text(self._screen_width // 2 - 3, 10, f"Score{str(score)}", 7) #??

class Controller:
    def __init__(self, model: Model, view: View):
        self._model = model
        self._view = view
    
    def start(self):
        self._view.start(self.update, self.draw, self._model.fps)

    def update(self):
        self._model.update()
    
    def draw(self):
        self._view.clear_screen()
        self._view.draw_score(self._model.score)
        if not self._model.is_game_over:
            self._view.draw_egg(self._model.egg)
            self._view.draw_egg_current_hp(self._model.egg)
        for enemy in self._model.eggnemies:
            self._view.draw_eggnemy(enemy)

if __name__ == "__main__":
    with open("settings.json", "r") as f:
        settings = json.load(f)

    config = Config(
        screen_width = settings["worldWidth"],
        screen_height = settings["worldHeight"],
        fps = settings["fps"],
        eggnemy_count = settings["numberOfEggnemies"]
    )
    egg: Egg = Egg(
        x = config.screen_width // 2,
        y = config.screen_height // 2,
        width = settings["eggWidth"],
        height = settings["eggHeight"],
        current_hp = settings["eggInitialHP"],
        max_hp = settings["eggInitialHP"],
        color = config.egg_color
    )
    eggnemies: list[Eggnemy] = []
    for i in range(config.eggnemy_count):
        eggnemies.append(Eggnemy(
            x = random.randint(0, config.screen_width - settings["eggnemyWidth"]), # random spawn
            y = random.randint(0, config.screen_height - settings["eggnemyHeight"]),
            width = settings["eggnemyWidth"],
            height = settings["eggnemyHeight"],
            color = config.eggnemy_color
        ))

    model = Model(config, egg, eggnemies)
    view = View(config.screen_width, config.screen_height)
    controller = Controller(model, view)
    controller.start()
