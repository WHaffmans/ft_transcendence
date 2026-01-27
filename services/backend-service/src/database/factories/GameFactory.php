<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Game>
 */
class GameFactory extends Factory
{
	/**
	 * Define the model's default state.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		$status = $this->faker->randomElement(['pending', 'ready', 'active', 'completed']);

		return [
			'status' => $status,
		];
	}

	public function configure()
	{
		return $this->afterCreating(function (\App\Models\Game $game) {
			$users = \App\Models\User::all()->random($this->faker->numberBetween(2, 4));
			$game->users()->attach($users->pluck('id'));

			if ($game->status === 'completed') {
				$users = $game->users;
				$ranks = range(1, $users->count());
				shuffle($ranks);

				foreach ($users as $index => $user) {
					$ratingMu = $this->faker->randomFloat(2, 20, 35);
					$ratingSigma = $this->faker->randomFloat(2, 5, 8.5);

					$game->users()->updateExistingPivot($user->id, [
						'rank' => $ranks[$index],
						'rating_mu' => $ratingMu,
						'rating_sigma' => $ratingSigma,
					]);

					$user->update([
						'rating_mu' => $ratingMu,
						'rating_sigma' => $ratingSigma,
					]);
				}
			}
		});
	}
}
