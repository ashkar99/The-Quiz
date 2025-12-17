/**
 * The main entry point of the application.
 * It imports the QuizGame class and initializes it.
 */

import { QuizGame } from './quizGame.js'

// Ensures the DOM is fully loaded before attaching the game to it.
document.addEventListener('DOMContentLoaded', () => {
  // Find the element where the app should live
  const appContainer = document.querySelector('#app')

  // Initialize the game
  const game = new QuizGame(appContainer)

  // Start the game
  game.init()
})
