from model import EggModel
from view import EggView

class EggController:
    def __init__(self, model: EggModel, view: EggView):
        self._model = model
        self._view = view

    def start(self):
        self._view.start(self.update, self.draw, self._model.fps)

    def update(self):
        self._model.update()

    def draw(self):
        self._view.draw_game(self._model)
