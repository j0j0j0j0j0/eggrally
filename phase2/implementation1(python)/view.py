import pyxel
from typing import Callable
from egg_types import PyxelColors, Rectangle
from model import EggModel

class EggView:
    def __init__(self, screen_width: int, screen_height: int):
        self._screen_width = screen_width
        self._screen_height = screen_height

    def start(self, update: Callable[[], None], draw: Callable[[], None], fps: int):
        pyxel.init(self._screen_width, self._screen_height, fps=fps)
        pyxel.run(update, draw)

    def draw_game(self, model: EggModel):
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

        pyxel.rectb(-cam_x, -cam_y, model.world_width, model.world_height, PyxelColors.WHITE) # borders
        pyxel.text(5, 5, f"Score: {model.score}", PyxelColors.WHITE)
        seconds = model.ticks // model.fps
        pyxel.text(5, 15, f"Time: {seconds//60:02}:{seconds%60:02}", PyxelColors.WHITE)
