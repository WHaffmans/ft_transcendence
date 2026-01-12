<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameControllerTest extends TestCase
{
	use RefreshDatabase;

	/**
	 * Test that a new game is created when no pending games exist.
	 */
	public function test_creates_new_game_when_no_pending_games_exist(): void
	{
		$user = User::factory()->create();

		$response = $this->actingAs($user)->postJson('/api/games');

		$response->assertStatus(200)
			->assertJsonStructure([
				'id',
				'status',
				'users' => [
					'*' => ['id', 'name', 'email']
				]
			])
			->assertJson([
				'status' => 'pending',
			]);

		$this->assertDatabaseHas('games', [
			'status' => 'pending',
		]);

		$this->assertDatabaseHas('user_game', [
			'user_id' => $user->id,
		]);
	}

	/**
	 * Test that user is added to existing pending game.
	 */
	public function test_adds_user_to_existing_pending_game(): void
	{
		$user1 = User::factory()->create();
		$user2 = User::factory()->create();

		// Create a pending game with user1
		$game = Game::create(['status' => 'pending']);
		$game->users()->attach($user1->id);

		// User2 tries to find a game
		$response = $this->actingAs($user2)->postJson('/api/games/find');

		$response->assertStatus(200)
			->assertJson([
				'id' => $game->id,
				'status' => 'pending',
			]);

		// Check that user2 was added to the game
		$this->assertDatabaseHas('user_game', [
			'game_id' => $game->id,
			'user_id' => $user2->id,
		]);

		// Verify the game now has 2 users
		$this->assertEquals(2, $game->fresh()->users()->count());
	}

	/**
	 * Test that user gets returned their existing game if already in one.
	 */
	public function test_returns_existing_game_if_user_already_in_pending_game(): void
	{
		$user = User::factory()->create();

		// Create a pending game with the user
		$game = Game::create(['status' => 'pending']);
		$game->users()->attach($user->id);

		// User tries to find a game again
		$response = $this->actingAs($user)->postJson('/api/games/find');

		$response->assertStatus(200)
			->assertJson([
				'id' => $game->id,
				'status' => 'pending',
			]);

		// Ensure no new game was created
		$this->assertEquals(1, Game::count());

		// Ensure user is only in one game
		$this->assertEquals(1, $user->fresh()->games()->count());
	}

	/**
	 * Test that user gets their own game even when multiple pending games exist.
	 */
	public function test_returns_users_game_when_multiple_pending_games_exist(): void
	{
		$user1 = User::factory()->create();
		$user2 = User::factory()->create();
		$user3 = User::factory()->create();

		// Create two pending games
		$game1 = Game::create(['status' => 'pending']);
		$game1->users()->attach($user1->id);

		$game2 = Game::create(['status' => 'pending']);
		$game2->users()->attach($user2->id);

		// User2 tries to find a game - should get their existing game
		$response = $this->actingAs($user2)->postJson('/api/games/find');

		$response->assertStatus(200)
			->assertJson([
				'id' => $game2->id,
				'status' => 'pending',
			]);

		// User3 (who is not in any game) should join the first available game
		$response = $this->actingAs($user3)->postJson('/api/games/find');

		$response->assertStatus(200)
			->assertJson([
				'id' => $game1->id,
				'status' => 'pending',
			]);

		// Verify user3 was added to game1
		$this->assertDatabaseHas('user_game', [
			'game_id' => $game1->id,
			'user_id' => $user3->id,
		]);
	}

	/**
	 * Test that only pending games are considered, not active or finished ones.
	 */
	public function test_ignores_non_pending_games(): void
	{
		$user1 = User::factory()->create();
		$user2 = User::factory()->create();

		// Create an active game with user1
		$activeGame = Game::create(['status' => 'active']);
		$activeGame->users()->attach($user1->id);

		// Create a finished game
		$finishedGame = Game::create(['status' => 'finished']);

		// User2 tries to find a game - should create a new one, not join existing non-pending games
		$response = $this->actingAs($user2)->postJson('/api/games/find');

		$response->assertStatus(200)
			->assertJson([
				'status' => 'pending',
			])
			->assertJsonMissing([
				'id' => $activeGame->id,
			])
			->assertJsonMissing([
				'id' => $finishedGame->id,
			]);

		// Verify a new game was created
		$this->assertEquals(3, Game::count());
	}

	/**
	 * Test that unauthenticated users cannot find games.
	 */
	public function test_unauthenticated_user_cannot_find_game(): void
	{
		$response = $this->postJson('/api/games/find');

		$response->assertStatus(401);
	}
}
