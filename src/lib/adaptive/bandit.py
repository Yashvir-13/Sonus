"""Multi-Armed Bandit (Reinforcement Learning) for adaptive remedial drill selection.

Uses Thompson Sampling (Beta-Binomial conjugate Bayesian update) and UCB1
to balance pedagogical exploration against exploiting proven effective drills.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Any


@dataclass
class BanditArm:
    """Represents a pedagogical intervention drill action."""

    name: str
    alpha: float = 1.0  # Successes / positive delta improvements
    beta: float = 1.0  # Failures / insignificant delta improvements
    pulls: int = 0
    total_reward: float = 0.0


class ThompsonSamplingBandit:
    """Bayesian Reinforcement Learning bandit for selecting remedial drills."""

    def __init__(self, arms: list[str] | None = None) -> None:
        default_arms = [
            "isolated_transition",
            "subdivision_click",
            "voicing_arpeggio",
            "gradual_tempo_ramp",
        ]
        arm_names = arms or default_arms
        self.arms: dict[str, BanditArm] = {name: BanditArm(name=name) for name in arm_names}

    def select_arm(self) -> str:
        """Sample from the Beta posterior of each arm and select argmax."""
        best_sample = -1.0
        selected_arm = next(iter(self.arms.keys()))

        for name, arm in self.arms.items():
            # Thompson sampling: draw theta ~ Beta(alpha, beta)
            sample = random.betavariate(arm.alpha, arm.beta)
            if sample > best_sample:
                best_sample = sample
                selected_arm = name

        return selected_arm

    def update_reward(self, arm_name: str, success: bool, reward_magnitude: float = 1.0) -> None:
        """Update arm priors based on longitudinal practice outcome."""
        if arm_name not in self.arms:
            self.arms[arm_name] = BanditArm(name=arm_name)

        arm = self.arms[arm_name]
        arm.pulls += 1
        arm.total_reward += (reward_magnitude if success else 0.0)

        if success:
            arm.alpha += 1.0
        else:
            arm.beta += 1.0


class UCB1Bandit:
    """Upper Confidence Bound (UCB1) deterministic reinforcement learning policy."""

    def __init__(self, arms: list[str] | None = None, exploration_c: float = 1.414) -> None:
        default_arms = [
            "isolated_transition",
            "subdivision_click",
            "voicing_arpeggio",
            "gradual_tempo_ramp",
        ]
        arm_names = arms or default_arms
        self.arms: dict[str, BanditArm] = {name: BanditArm(name=name) for name in arm_names}
        self.c = exploration_c
        self.total_pulls = 0

    def select_arm(self) -> str:
        """Select arm maximizing average reward + exploration bonus."""
        self.total_pulls += 1

        # Play each arm at least once during warm-up
        for name, arm in self.arms.items():
            if arm.pulls == 0:
                return name

        best_score = -float("inf")
        selected = next(iter(self.arms.keys()))

        for name, arm in self.arms.items():
            mean_reward = arm.total_reward / arm.pulls
            bonus = self.c * math.sqrt(math.log(self.total_pulls) / arm.pulls)
            score = mean_reward + bonus
            if score > best_score:
                best_score = score
                selected = name

        return selected

    def update_reward(self, arm_name: str, reward: float) -> None:
        """Update arm statistics with observed numerical reward."""
        if arm_name not in self.arms:
            self.arms[arm_name] = BanditArm(name=arm_name)

        arm = self.arms[arm_name]
        arm.pulls += 1
        arm.total_reward += reward
