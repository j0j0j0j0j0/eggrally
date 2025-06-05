import pyxel
import json
import math
import random
from enum import IntEnum
from dataclasses import dataclass
from typing import Callable

# Phase 1 
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
    egg_width: int
    egg_height: int
    egg_init_hp: int
    egg_speed: int
    egg_color: int
    eggnemy_width: int
    eggnemy_height: int
    eggnemy_init_hp: int
    init_eggnemy_count: int
    eggnemies_to_defeat_for_boss: int
    eggnemy_speed: int
    eggnemy_color: int
    boss_width: int
    boss_height: int
    boss_init_hp: int
    boss_speed: int
    boss_color: int

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
        self._has_defeated_boss = False

    def update(self):
        if self._is_game_over:
            return

        spawn_chance = 0.2 / self._config.fps
        if random.random() < spawn_chance:
            self._spawn_eggnemy()

        if not self._boss and self._score >= self._config.eggnemies_to_defeat_for_boss:
            self._spawn_boss()

        self._ticks += 1
        self._move_egg()

        can_be_damaged = self._ticks - self._last_hit >= self._config.fps

        for enemy in self._eggnemies:
            enemy.move_towards(self._egg, self._config.eggnemy_speed)
            if self._is_colliding(self._egg, enemy):
                if can_be_damaged:
                    self._egg.current_hp -= 1
                    self._last_hit = self._ticks
                    if self._egg.current_hp <= 0:
                        self._is_game_over = True
        if self._boss:
            self._boss.move_towards(self._egg, self._config.boss_speed)
            if self._is_colliding(self._egg, self._boss):
                if can_be_damaged:
                    self._egg.current_hp -= 3
                    if self._egg.current_hp < 0:
                        self._egg.current_hp = 0
                    self._last_hit = self._ticks
                    if self._egg.current_hp <= 0:
                        self._is_game_over = True

        if pyxel.btn(pyxel.KEY_L):
            self._attack()

    def _move_egg(self):
        offset_x = offset_y = 0
        if pyxel.btn(pyxel.KEY_W): offset_y -= self._config.egg_speed
        if pyxel.btn(pyxel.KEY_S): offset_y += self._config.egg_speed
        if pyxel.btn(pyxel.KEY_A): offset_x -= self._config.egg_speed
        if pyxel.btn(pyxel.KEY_D): offset_x += self._config.egg_speed

        self._egg.x = max(0, min(self._egg.x + offset_x, self.world_width - self._egg.width))
        self._egg.y = max(0, min(self._egg.y + offset_y, self.world_height - self._egg.height))

    def _attack(self):
        attack_range = self._egg.width #?? for relative range?

        new_eggnemies: list[Eggnemy] = []
        for e in self._eggnemies:
            if self._get_distance(self._egg, e) > attack_range:
                new_eggnemies.append(e)
            else:
                assert self._get_distance(self._egg, e) <= attack_range
                e.current_hp -= 1
                if e.current_hp <= 0:
                    self._score += 1
                    continue
                else:
                    new_eggnemies.append(e)

        self._eggnemies = new_eggnemies
        if self._boss:
            if self._get_distance(self._egg, self._boss) <= attack_range:
                self._boss.current_hp -= 1
                if self._boss.current_hp <= 0:
                    self._boss = None
                    self._has_defeated_boss = True
                    self._is_game_over = True

    def _spawn_eggnemy(self):
        self._eggnemies.append(Eggnemy(
            x = random.randint(0, self.world_width - self._config.eggnemy_width),
            y = random.randint(0, self.world_height - self._config.eggnemy_height),
            width = self._config.eggnemy_width,
            height = self._config.eggnemy_height,
            color = self._config.eggnemy_color,
            current_hp = self._config.eggnemy_init_hp,
            max_hp = self._config.eggnemy_init_hp,
        ))
    def _spawn_boss(self):
        self._boss =  Boss(
                x = random.randint(0, self.world_width - self._config.boss_width),
                y = random.randint(0, self.world_height - self._config.boss_height),
                width = self._config.boss_width,
                height = self._config.boss_height,
                color = self._config.boss_color,
                current_hp = self._config.boss_init_hp,
                max_hp = self._config.boss_init_hp,
            )
    
    def _get_distance(self, r1: Rectangle, r2: Rectangle):
        return math.sqrt((r1.midx - r2.midx) ** 2 + (r1.midy - r2.midy) ** 2)

    def _is_colliding(self, r1: Rectangle, r2: Rectangle):
        return not (r1.right < r2.left or r1.left > r2.right or r1.bottom < r2.top or r1.top > r2.bottom)

    @property
    def egg(self): return self._egg
    @property
    def eggnemies(self): return self._eggnemies
    @property
    def boss(self): return self._boss
    @property
    def has_defeated_boss(self): return self._has_defeated_boss
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
        pyxel.text(model.screen_width // 2 - 10, model.egg.y - cam_y + model.egg.height + 5, f"{model.egg.current_hp}/{model.egg.max_hp}", model.egg.color)

        for e in model.eggnemies:
            draw_rect(e)
            pyxel.text(e.x - cam_x, e.y - cam_y + e.height + 5, f"{e.current_hp}/{e.max_hp}", e.color)

        if model.boss:
            draw_rect(model.boss)
            pyxel.text(model.boss.x - cam_x, model.boss.y - cam_y + model.boss.height + 5, f"{model.boss.current_hp}/{model.boss.max_hp}", PyxelColors.WHITE)

        if model.is_game_over:
            if model.has_defeated_boss and model.egg.current_hp >= 0:
                pyxel.text(model.screen_width // 2 - 15, model.screen_height // 2 - model.egg.height, "You Win!", PyxelColors.WHITE)
            else:
                assert not model.has_defeated_boss and model.egg.current_hp <= 0
                pyxel.text(model.screen_width // 2 - 20, model.screen_height // 2 - model.egg.height, "GAME OVER", PyxelColors.RED)

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

    model = Model(config, egg, enemies)
    view = View(config.screen_width, config.screen_height)
    controller = Controller(model, view)
    controller.start()
