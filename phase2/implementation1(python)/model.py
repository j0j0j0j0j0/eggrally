import pyxel
import math
import random
from egg_types import Rectangle, Egg, Eggnemy, Boss, Config

class EggModel:
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
    def config(self): return self._config
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
    def last_hit(self): return self._last_hit
    @property
    def world_width(self): return self._config.world_width
    @property
    def world_height(self): return self._config.world_height
    @property
    def screen_width(self): return self._config.screen_width
    @property
    def screen_height(self): return self._config.screen_height
