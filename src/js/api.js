/**
 * QuizAPI
 * Handles all network requests to the quiz server.
 */
export class QuizAPI {
  /**
   * Fetches a question from the given URL.
   * @param {string} url - The URL to fetch the question from.
   * @returns {Promise<object>} - The JSON response from the server.
   */
  async getQuestion (url) {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Sends an answer to the server.
   * @param {string} url - The URL to post the answer.
   * @param {string|object} answer - The answer data
   * @returns {Promise<object>} - The JSON response from the server
   */
  async sendAnswer (url, answer) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(answer)
    })

    if (!response.ok) {
      // Throw an error for non wanted responses
      throw new Error(`Server returned status: ${response.status}`)
    }

    return await response.json()
  }
}
