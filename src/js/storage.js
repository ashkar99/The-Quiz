/**
 * HighScoreManager
 * Handles saving and loading high scores from window.localStorage.
 */
export class HighScoreManager {
  constructor () {
    this.storageKey = 'quiz_high_scores'
  }

  /**
   * Retrieves the top 5 high scores.
   * @returns {Array} Array of score objects
   */
  getHighScores () {
    const scoresJSON = localStorage.getItem(this.storageKey)
    if (!scoresJSON) {
      return []
    }
    return JSON.parse(scoresJSON)
  }

  /**
   * Saves a new score if it qualifies for the top 5.
   * @param {string} nickname - The player's nickname
   * @param {number} totalTime (in milliseconds)
   */
  saveScore (nickname, totalTime) {
    const scores = this.getHighScores()

    // Add the new result
    scores.push({ nickname, time: totalTime })

    // Sort by time (lowest/fastest first)
    scores.sort((a, b) => a.time - b.time)

    // Keep only the top 5
    const top5 = scores.slice(0, 5)

    // Save back to storage
    localStorage.setItem(this.storageKey, JSON.stringify(top5))
  }
}
