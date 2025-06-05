import pyxel
from egg_types import PyxelColors, Config, Egg, Eggnemy, Boss
from model import EggModel

# accesses private attr for testing

def base_config_and_model():
    config = Config(
        screen_width=100,
        screen_height=100,
        world_width=200,
        world_height=200,
        fps=30,
        egg_width=5,
        egg_height=5,
        egg_init_hp=3,
        egg_speed=3,
        egg_color=PyxelColors.WHITE,
        eggnemy_width=5,
        eggnemy_height=5,
        eggnemy_init_hp=2,
        init_eggnemy_count=0,
        eggnemies_to_defeat_for_boss=3,
        eggnemy_speed=1,
        eggnemy_color=PyxelColors.YELLOW,
        boss_width=5,
        boss_height=5,
        boss_init_hp=5,
        boss_speed=2,
        boss_color=PyxelColors.RED,
    )
    egg = Egg(
        x=config.world_width // 2,
        y=config.world_height // 2,
        width=config.egg_width,
        height=config.egg_height,
        current_hp=config.egg_init_hp,
        max_hp=config.egg_init_hp,
        color=config.egg_color
    )
    return config, EggModel(config, egg, [])

def mock_btn(key):
    return key == pyxel.KEY_L

pyxel.btn = mock_btn


# 10 Tests so far

def test_model_init():
    model = base_config_and_model()[1]
    assert model.world_width == model.config.world_width
    assert model.world_height == model.config.world_height
    assert model.egg.x == 100 and model.egg.y == 100
    assert model.eggnemies == []
    assert model.boss is None
    assert not model.is_game_over
    assert not model.has_defeated_boss
    assert model.last_hit == -1000

def test_spawn_eggnemy():
    model = base_config_and_model()[1]
    assert len(model.eggnemies) == 0
    model._spawn_eggnemy()
    assert len(model.eggnemies) == 1
    e = model.eggnemies[0]
    assert 0 <= e.x <= model.world_width - e.width
    assert 0 <= e.y <= model.world_height - e.height
    assert e.current_hp > 0
    assert e.current_hp == model.config.eggnemy_init_hp
    assert e.color == model.config.eggnemy_color

def test_spawn_boss():
    config, model = base_config_and_model()
    model._score = config.eggnemies_to_defeat_for_boss
    model._spawn_boss()
    assert model.boss is not None
    b = model.boss
    assert b.current_hp == config.boss_init_hp
    assert 0 <= b.x <= model.world_width - b.width
    assert 0 <= b.y <= model.world_height - b.height
    assert b.max_hp == model.config.boss_init_hp
    assert b.color == model.config.boss_color

def test_eggnemy_moves_toward_egg():
    model = base_config_and_model()[1]
    model._move_egg = lambda: None
    model._attack = lambda: None
    enemy = Eggnemy(x=0, y=0, width=5, height=5,color=PyxelColors.YELLOW, current_hp=2, max_hp=2)
    model.eggnemies.append(enemy)
    before = (enemy.x, enemy.y)
    model.update()
    after = (enemy.x, enemy.y)
    assert after != before
    assert abs(after[0] - model.egg.x) < abs(before[0] - model.egg.x) or abs(after[1] - model.egg.y) < abs(before[1] - model.egg.y)
    dist_before = abs(before[0] - model.egg.x) + abs(before[1] - model.egg.y)
    dist_after = abs(after[0] - model.egg.x) + abs(after[1] - model.egg.y)
    assert dist_after < dist_before

def test_attack_defeats():
    model = base_config_and_model()[1]
    egg = model.egg
    eggnemy = Eggnemy(x=egg.x, y=egg.y, width=5, height=5, color=PyxelColors.YELLOW, current_hp=1, max_hp=1)
    model.eggnemies.append(eggnemy)
    model._attack()
    assert len(model.eggnemies) == 0
    assert model.score == 1

def test_attack_damages():
    model = base_config_and_model()[1]
    egg = model.egg
    enemy = Eggnemy(x=egg.x, y=egg.y, width=5, height=5, color=PyxelColors.YELLOW, current_hp=2, max_hp=2)
    model.eggnemies.append(enemy)
    model._attack()
    assert len(model.eggnemies) == 1
    assert model.eggnemies[0].current_hp == 1
    assert model._score == 0

def test_collision_damages():
    config, model = base_config_and_model()
    model._move_egg = lambda: None
    model._attack = lambda: None
    model._last_hit = model._ticks - model.fps  
    model.eggnemies.append(Eggnemy(x=model.egg.x, y=model.egg.y, width=5, height=5, color=PyxelColors.YELLOW, current_hp=1, max_hp=1))
    model.update()
    expected_hp = config.egg_init_hp - 1
    assert model.egg.current_hp == expected_hp
    hp_before = model.egg.current_hp
    model.update()
    assert model.egg.current_hp == hp_before

def test_boss_collision_damages():
    config, model = base_config_and_model()
    # Put boss on egg to collide
    model._boss = Boss(x=model.egg.x, y=model.egg.y, width=5, height=5,color=PyxelColors.RED, current_hp=5, max_hp=5)
    model._move_egg = lambda: None
    model._attack = lambda: None
    model._last_hit = model._ticks - model.fps
    model.update()
    expected_hp = config.egg_init_hp - 3
    assert model.egg.current_hp == expected_hp

def test_game_won():
    model = base_config_and_model()[1]
    model._boss = Boss(x=model.egg.x, y=model.egg.y, width=5, height=5, color=PyxelColors.RED, current_hp=1, max_hp=1)
    model._attack()
    assert model.boss is None
    assert model.has_defeated_boss
    assert model.is_game_over
    assert model._score >= 0

def test_game_over():
    model = base_config_and_model()[1]
    model._move_egg = lambda: None
    model._attack = lambda: None
    model.egg.current_hp = 1
    model._last_hit = model._ticks - model.fps 
    model.eggnemies.append(Eggnemy(x=model.egg.x, y=model.egg.y, width=5, height=5,color=PyxelColors.YELLOW, current_hp=1, max_hp=1))
    model.update()
    assert model.is_game_over
    assert model.egg.current_hp == 0
    
