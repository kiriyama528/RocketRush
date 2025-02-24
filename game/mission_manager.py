
from abc import ABC, abstractmethod
import random

class MissionProvider(ABC):
    @abstractmethod
    def get_available_missions(self):
        pass

class DefaultMissionProvider(MissionProvider):
    def get_available_missions(self):
        return [
            {'id': 'm1', 'name': 'Orbit Insertion', 'required_thrust': 80, 'points': 5},
            {'id': 'm2', 'name': 'Space Station Resupply', 'required_thrust': 120, 'points': 8},
            {'id': 'm3', 'name': 'Moon Mission', 'required_thrust': 150, 'points': 12}
        ]

class MissionManager:
    def __init__(self, provider: MissionProvider):
        self.provider = provider
        self.missions = self.provider.get_available_missions()

    def get_random_mission(self):
        return random.choice(self.missions)
