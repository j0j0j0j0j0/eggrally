import pyxel
import json
import math
import random
from enum import IntEnum
from dataclasses import dataclass
from typing import Callable

# Phase 1 so disorganized ehhe

@dataclass
class Rectangle:
    x: float
    y: float
    width: int
    height: int
    color: int
    current_hp: int
    max_hp: int

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
    def move(self, speed: int, world_width: int, world_height: int):
        if pyxel.btn(pyxel.KEY_W): self.y -= speed
        if pyxel.btn(pyxel.KEY_S): self.y += speed
        if pyxel.btn(pyxel.KEY_A): self.x -= speed
        if pyxel.btn(pyxel.KEY_D): self.x += speed

        self.x = max(0, min(self.x, world_width - self.width))
        self.y = max(0, min(self.y, world_height - self.height))

@dataclass
class Eggnemy(Rectangle):
    def move_towards(self, egg: Egg, speed: int):
        diffx = egg.midx - self.midx
        diffy = egg.midy - self.midy
        distance = math.hypot(diffx, diffy) or 1
        self.x += diffx / distance * speed
        self.y += diffy / distance * speed

@dataclass
class Boss(Rectangle):
    def move_towards(self, egg: Egg, speed: int):
        diffx = egg.midx - self.midx
        diffy = egg.midy - self.midy
        distance = math.hypot(diffx, diffy) or 1
        self.x += diffx / distance * speed
        self.y += diffy / distance * speed

@dataclass
class Config:
    screen_width: int
    screen_height: int
    world_width: int
    world_height: int
    fps: int
    init_eggnemy_count: int
    egg_speed: int
    eggnemy_speed: int
    boss_speed: int
    boss_width: int
    boss_height: int
    egg_color: int
    eggnemy_color: int
    boss_color: int
    eggnemies_to_defeat_for_boss: int

class PyxelColors(IntEnum):
    BLACK = 0
    DARK_BLUE = 1
    MAGENTA = 2
    CYAN = 3
    BROWN = 4
    BLUE = 5
    INDIGO = 6
    WHITE = 7
    RED = 8
    ORANGE = 9
    YELLOW = 10
    TEAL = 11
    LIGHT_BLUE = 12
    GREY = 13
    PEACH = 14
    PASTEL = 15

# MVU
class Model:
    def __init__(self, config: Config, egg: Egg, eggnemies: list[Eggnemy]):
        self._config = config
        self._egg = egg
        self._eggnemies = eggnemies
        self._is_game_over = False
        self._score = 0
        self._ticks = 0
        self._last_hit = -1000
        self._boss: Boss | None = None

    def update(self):
        if self._is_game_over:
            return

        self._ticks += 1

        
        offset_x = offset_y = 0
        if pyxel.btn(pyxel.KEY_W): offset_y -= self._config.egg_speed
        if pyxel.btn(pyxel.KEY_S): offset_y += self._config.egg_speed
        if pyxel.btn(pyxel.KEY_A): offset_x -= self._config.egg_speed
        if pyxel.btn(pyxel.KEY_D): offset_x += self._config.egg_speed

        # Clamp egg position inside world boundaries
        self._egg.x = max(0, min(self._egg.x + offset_x, self.world_width - self._egg.width))
        self._egg.y = max(0, min(self._egg.y + offset_y, self.world_height - self._egg.height))

        # Update boss and enemies as before
        if self._boss:
            self._boss.move_towards(self._egg, self._config.boss_speed)
            if self._is_colliding(self._egg, self._boss):
                if self._ticks - self._last_hit >= self._config.fps:
                    self._egg.current_hp -= 3 
                    self._last_hit = self._ticks
                    if self._egg.current_hp <= 0:
                        self._is_game_over = True

        for enemy in self._eggnemies:
            enemy.move_towards(self._egg, self._config.eggnemy_speed)
            if self._is_colliding(self._egg, enemy):
                if self._ticks - self._last_hit >= self._config.fps:
                    self._egg.current_hp -= 1
                    self._last_hit = self._ticks
                    if self._egg.current_hp <= 0:
                        self._is_game_over = True

        if pyxel.btn(pyxel.KEY_L):
            self._attack()

        if not self._eggnemies and not self._boss:
            self._boss = Boss(
                x = random.randint(0, self.world_width - self._config.boss_width),
                y = random.randint(0, self.world_height - self._config.boss_height),
                width = 32,
                height = 32,
                color = self._config.boss_color,
                current_hp = 10,
                max_hp = 10
            )

    def _attack(self):
        attack_range = 50
        target_x, target_y = self._egg.midx, self._egg.midy
        self._eggnemies = [e for e in self._eggnemies if math.hypot(e.midx - target_x, e.midy - target_y) > attack_range or not self._increment_score()]
        if self._boss:
            dist = math.hypot(self._boss.midx - target_x, self._boss.midy - target_y)
            if dist <= attack_range:
                self._boss.current_hp -= 1
                if self._boss.current_hp <= 0:
                    self._score += 1
                    self._is_game_over = True

    def _increment_score(self):
        self._score += 1
        return False

    def _is_colliding(self, r1: Rectangle, r2: Rectangle):
        return not (r1.right < r2.left or r1.left > r2.right or r1.bottom < r2.top or r1.top > r2.bottom)

    @property
    def egg(self): return self._egg
    @property
    def eggnemies(self): return self._eggnemies
    @property
    def boss(self): return self._boss
    @property
    def is_game_over(self): return self._is_game_over
    @property
    def score(self): return self._score
    @property
    def fps(self): return self._config.fps
    @property
    def ticks(self): return self._ticks
    @property
    def world_width(self): return self._config.world_width
    @property
    def world_height(self): return self._config.world_height
    @property
    def screen_width(self): return self._config.screen_width
    @property
    def screen_height(self): return self._config.screen_height

class View:
    def __init__(self, screen_width: int, screen_height: int):
        self._screen_width = screen_width
        self._screen_height = screen_height

    def start(self, update: Callable[[], None], draw: Callable[[], None], fps: int):
        pyxel.init(self._screen_width, self._screen_height, fps=fps)
        pyxel.run(update, draw)

    def draw_game(self, model: Model):
        pyxel.cls(0)

        cam_x = model.egg.midx - model.screen_width // 2
        cam_y = model.egg.midy - model.screen_height // 2

        def draw_rect(r: Rectangle):
            pyxel.rect(r.x - cam_x, r.y - cam_y, r.width, r.height, r.color)

        draw_rect(model.egg)
        pyxel.text(model.egg.x - cam_x + 15, model.egg.y - cam_y + model.egg.height + 8, f"{model.egg.current_hp}/{model.egg.max_hp}", model.egg.color)

        for e in model.eggnemies:
            draw_rect(e)
        if model.boss:
            draw_rect(model.boss)
            pyxel.text(model.boss.x - cam_x, model.boss.y - 10 - cam_y, f"Boss HP: {model.boss.current_hp}", PyxelColors.WHITE)

        pyxel.rectb(-cam_x, -cam_y, model.world_width, model.world_height, PyxelColors.WHITE) # border
        pyxel.text(5, 5, f"Score: {model.score}", PyxelColors.WHITE)
        seconds = model.ticks // model.fps
        pyxel.text(5, 15, f"Time: {seconds//60:02}:{seconds%60:02}", PyxelColors.WHITE)
        
class Controller:
    def __init__(self, model: Model, view: View):
        self._model = model
        self._view = view

    def start(self):
        self._view.start(self.update, self.draw, self._model.fps)

    def update(self):
        self._model.update()

    def draw(self):
        self._view.draw_game(self._model)

if __name__ == "__main__":
    with open("settings1.json") as f:
        s = json.load(f)

    config = Config(
        screen_width = s["screenWidth"],
        screen_height = s["screenHeight"],
        world_width = s["worldWidth"],
        world_height = s["worldHeight"],
        fps = s["fps"],
        init_eggnemy_count = s["initialNumberOfEggnemies"],
        eggnemies_to_defeat_for_boss = s["eggnemiesToDefeatForBoss"],
        egg_speed = 5,
        eggnemy_speed = 2,
        boss_speed = 3,
        boss_width = s["bossWidth"],
        boss_height = s["bossHeight"],
        egg_color = PyxelColors.WHITE,
        eggnemy_color = PyxelColors.YELLOW,
        boss_color = PyxelColors.RED,
    )

    egg = Egg(
        x=s["worldWidth"] // 2,
        y=s["worldHeight"] // 2,
        width=s["eggWidth"],
        height=s["eggHeight"],
        current_hp=s["eggInitialHP"],
        max_hp=s["eggInitialHP"],
        color=config.egg_color
    )

    enemies = [
        Eggnemy(
            x = random.randint(0, s["worldWidth"] - s["eggnemyWidth"]),
            y = random.randint(0, s["worldHeight"] - s["eggnemyHeight"]),
            width = s["eggnemyWidth"],
            height = s["eggnemyHeight"],
            color = config.eggnemy_color,
            current_hp = s["eggnemyInitialHP"],
            max_hp = s["eggnemyInitialHP"]
        ) for _ in range(config.init_eggnemy_count)
    ]

    model = Model(config, egg, enemies)
    view = View(config.screen_width, config.screen_height)
    controller = Controller(model, view)
    controller.start()
