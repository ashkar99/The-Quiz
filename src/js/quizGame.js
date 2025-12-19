import { QuizAPI } from './api.js'
import { HighScoreManager } from './storage.js'

/**
 * QuizGame
 * The main controller for the application.
 * Manages the game state, timer, and UI rendering.
 */
export class QuizGame {
  /**
   * @param {HTMLElement} container - The DOM element where the game is rendered.
   */
  constructor (container) {
    this.container = container
    this.api = new QuizAPI()
    this.storage = new HighScoreManager()

    // Game State
    this.nickname = ''
    this.totalTime = 0 // Total time taken for the whole game
    this.questionStartTime = 0 // Timestamp when the current question started
    this.timerInterval = null

    // The starting URL for the quiz
    this.startUrl = 'https://courselab.lnu.se/quiz/question/1'
  }

  /**
   * Initializes the game
   */
  init () {
    this.renderStartScreen()
  }

  /**
   * Renders the nickname input form.
   */
  renderStartScreen () {
    this.container.innerHTML = `
      <h2>Welcome to the Quiz!</h2>
      <p>Enter your nickname to start.</p>
      <input type="text" id="nickname" placeholder="Nickname" autofocus />
      <br>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px;">
        <button id="start-btn">Start Game</button>
        <button id="highscore-btn" style="background-color: #555;">High Scores</button>
      </div>
      <div id="message" class="error-message"></div>
      <p style="font-size: 0.8rem; margin-top: 20px; color: #666;">
        Type name & press <strong>Enter</strong>. Use <strong>&darr;</strong> for menu.
      </p>
    `

    const input = this.container.querySelector('#nickname')
    const startBtn = this.container.querySelector('#start-btn')
    const highscoreBtn = this.container.querySelector('#highscore-btn')

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        startBtn.click() // Enter starts the game
      } else if (event.key === 'ArrowDown') {
        startBtn.focus() // Down Arrow jumps to the buttons
      }
    })

    // BUTTON NAVIGATION (Arrow Keys)
    const handleBtnNav = (event) => {
      if (event.key === 'ArrowRight') {
        highscoreBtn.focus()
      } else if (event.key === 'ArrowLeft') {
        startBtn.focus()
      } else if (event.key === 'ArrowUp') {
        input.focus() // Up Arrow goes back to text box
      }
    }

    startBtn.addEventListener('keydown', handleBtnNav)
    highscoreBtn.addEventListener('keydown', handleBtnNav)

    // CLICK LISTENERS
    startBtn.addEventListener('click', () => {
      const nickname = input.value.trim()
      if (nickname) {
        this.nickname = nickname
        this.startGame()
      } else {
        this.showMessage('Please enter a nickname!', 'error')
      }
    })

    highscoreBtn.addEventListener('click', () => this.renderHighScoreScreen())
  }

  /**
   * Starts the game
   */
  async startGame () {
    this.totalTime = 0
    // Fetch first question
    await this.fetchQuestion(this.startUrl)
  }

  /**
   * Fetches a question and renders it.
   * @param {string} url - The URL to fetch the question from.
   */
  async fetchQuestion (url) {
    try {
      this.container.innerHTML = '<h3>Loading question...</h3>'

      const data = await this.api.getQuestion(url)
      this.renderQuestion(data)
    } catch (error) {
      console.error(error)
      this.renderGameOver('Network Error or Server Down.')
    }
  }

  /**
   * Renders the Question UI based on the server response.
   * @param {object} data - The question object from the server.
   */
  renderQuestion (data) {
    // Setup the Timer UI
    this.container.innerHTML = `
      <div id="timer-container"><div id="timer-bar"></div></div>
      <h3>Question:</h3>
      <p class="question-text">${data.question}</p>
      <div id="inputs-area"></div>
    `
    const inputsArea = this.container.querySelector('#inputs-area')

    // Determine input type
    if (data.alternatives) {
      this.renderAlternatives(inputsArea, data)
    } else {
      this.renderTextInput(inputsArea, data)
    }

    this.startTimer()
  }

  /**
   * Renders a simple Text Input for open questions.
   * @param {HTMLElement} element - The container to render the input into.
   * @param {object} data - The question data containing nextURL.
   */
  renderTextInput (element, data) {
    const input = document.createElement('input')
    input.type = 'text' // Text input

    const btn = document.createElement('button')
    btn.textContent = 'Submit Answer'

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        btn.click()
      }
    })
    btn.addEventListener('click', () => {
      if (input.value) {
        this.submitAnswer(data.nextURL, { answer: input.value })
      }
    })

    element.appendChild(input)
    element.appendChild(btn)
    input.focus()
  }

  /**
   * Renders Radio Buttons for multi-choice questions.
   * @param {HTMLElement} element - The container to render the alternatives into.
   * @param {object} data - The question data containing alternatives and nextURL.
   */
  renderAlternatives (element, data) {
    const form = document.createElement('div')
    form.className = 'alternatives'

    // Create radio buttons for each alternative
    for (const [key, value] of Object.entries(data.alternatives)) {
      const label = document.createElement('label')
      label.innerHTML = `
        <input type="radio" name="alt" value="${key}"> 
        ${value}
      `
      form.appendChild(label)
    }

    const btn = document.createElement('button')
    btn.textContent = 'Submit Answer'
    const submit = () => {
      const selected = form.querySelector('input[name="alt"]:checked')
      if (selected) {
        this.submitAnswer(data.nextURL, { answer: selected.value })
      }
    }
    btn.addEventListener('click', submit)
    form.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        submit()
      }
    })

    element.appendChild(form)
    element.appendChild(btn)

    const firstInput = form.querySelector('input')
    if (firstInput) {
      firstInput.focus()
      firstInput.checked = true
    }
  }

  /**
   * Handles the countdown logic
   */
  startTimer () {
    this.questionStartTime = Date.now()
    const timerBar = document.querySelector('#timer-bar')
    const timerContainer = document.querySelector('#timer-container')
    timerContainer.style.display = 'block'

    // Reset any existing timer
    if (this.timerInterval) clearInterval(this.timerInterval)

    this.timerInterval = setInterval(() => {
      this.timerWidth -= 10 // Reduce timer bar width
      const elapsed = (Date.now() - this.questionStartTime) / 1000
      const remaining = 10 - elapsed
      const percentage = (remaining / 10) * 100

      if (timerBar) timerBar.style.width = `${percentage}%`

      if (remaining <= 0) {
        this.stopTimer()
        this.renderGameOver('Time is up!')
      }
    }, 100) // Update every 100ms for smoothness
  }

  stopTimer () {
    clearInterval(this.timerInterval)
    // Add the time taken for this question to total time
    const elapsed = (Date.now() - this.questionStartTime)
    this.totalTime += elapsed
  }

  /**
   * Sends the answer to the server.
   * @param {string} url - The URL to send the answer to.
   * @param {object} answerPayload - The answer data to send.
   */
  async submitAnswer (url, answerPayload) {
    this.stopTimer()

    try {
      const response = await this.api.sendAnswer(url, answerPayload)

      // Get next question or end game
      if (response.nextURL) {
        this.fetchQuestion(response.nextURL)
      } else {
        this.renderVictory()
      }
    } catch (error) {
      console.log(error)
      this.renderGameOver('Wrong Answer! Game Over.')
    }
  }

  renderGameOver (message) {
    this.container.innerHTML = `
      <h2>Game Over</h2>
      <p class="error-message">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button id="restart-btn">Try Again</button>
        <button id="highscore-btn" style="background-color: #555;">High Scores</button>
      </div>
      <p style="font-size: 0.8rem; margin-top: 20px; color: #666;">
        Use <strong>&larr; &rarr;</strong> to move, <strong>Enter</strong> to select
      </p>
    `
    const restartBtn = this.container.querySelector('#restart-btn')
    const highscoreBtn = this.container.querySelector('#highscore-btn')

    // Click Listeners
    restartBtn.addEventListener('click', () => this.init())
    highscoreBtn.addEventListener('click', () => this.renderHighScoreScreen())

    // Auto-focus the first button so the keyboard works immediately
    restartBtn.focus()

    // Add Arrow Key Navigation for the Buttons
    const handleArrowNav = (event) => {
      if (event.key === 'ArrowRight') {
        highscoreBtn.focus()
      } else if (event.key === 'ArrowLeft') {
        restartBtn.focus()
      }
    }

    restartBtn.addEventListener('keydown', handleArrowNav)
    highscoreBtn.addEventListener('keydown', handleArrowNav)
  }

  renderVictory () {
    const timeInSeconds = (this.totalTime / 1000).toFixed(2)
    this.storage.saveScore(this.nickname, this.totalTime)

    // Render the Victory Screen
    this.container.innerHTML = `
      <h2 class="success-message">Victory!</h2>
      <p>Well done, ${this.nickname}!</p>
      <p>Total Time: ${timeInSeconds} seconds</p>
      
      <div id="high-score-list">
        <h3>High Scores (Top 5)</h3>
        <ol id="score-list-ol" style="text-align: left; display: inline-block; margin: 0 auto;"></ol>
      </div>

      <br>
      <button id="restart-btn">Play Again</button>
      <p style="font-size: 0.8rem; margin-top: 20px; color: #666;">
        Press <strong>Enter</strong> to restart
      </p>
    `

    // Populate the list manually
    const listEl = this.container.querySelector('#score-list-ol')
    const topScores = this.storage.getHighScores()

    if (topScores.length === 0) {
      listEl.innerHTML = '<li>No scores yet!</li>'
    } else {
      topScores.forEach(score => {
        const li = document.createElement('li')
        const seconds = (score.time / 1000).toFixed(2)
        li.textContent = `${score.nickname} : ${seconds} seconds`
        listEl.appendChild(li)
      })
    }

    // Keyboard Support
    const restartBtn = this.container.querySelector('#restart-btn')
    restartBtn.addEventListener('click', () => this.init())
    restartBtn.focus()
  }

  /**
   * Renders the High Score list.
   */
  renderHighScoreScreen () {
    const topScores = this.storage.getHighScores()

    this.container.innerHTML = `
      <h2>Top 5 High Scores</h2>
      <ol id="score-list-ol" style="text-align: left; display: inline-block; margin: 0 auto;"></ol>
      <br><br>
      <button id="back-btn">Back to Start</button>
      <p style="font-size: 0.8rem; margin-top: 20px; color: #666;">
        Press <strong>Enter</strong> to go back
      </p>
    `

    const listEl = this.container.querySelector('#score-list-ol')
    if (topScores.length === 0) {
      listEl.innerHTML = '<li>No scores yet!</li>'
    } else {
      topScores.forEach(score => {
        const li = document.createElement('li')
        const seconds = (score.time / 1000).toFixed(2)
        li.textContent = `${score.nickname} : ${seconds} seconds`
        listEl.appendChild(li)
      })
    }

    const backBtn = this.container.querySelector('#back-btn')
    backBtn.addEventListener('click', () => this.renderStartScreen())
    backBtn.focus()
  }

  showMessage (msg, type) {
    const el = this.container.querySelector('#message')
    if (el) {
      el.textContent = msg
      el.className = type === 'error' ? 'error-message' : 'success-message'
    }
  }
}
