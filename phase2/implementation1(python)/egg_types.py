import pyxel
import math
from enum import IntEnum
from dataclasses import dataclass

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
