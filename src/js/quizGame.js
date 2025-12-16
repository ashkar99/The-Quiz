import { QuizAPI } from './api.js'

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
      <button id="start-btn">Start Game</button>
      <div id="message" class="error-message"></div>
    `

    this.container.querySelector('#start-btn').addEventListener('click', () => {
      const input = this.container.querySelector('#nickname')
      const nickname = input.value.trim()

      if (nickname) {
        this.nickname = nickname
        this.startGame()
      } else {
        this.showMessage('Please enter a nickname!', 'error')
      }
    })
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
   * @param {string} url 
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
   */
  renderTextInput (element, data) {
    const input = document.createElement('input')
    input.type = 'text' // Text input
    
    const btn = document.createElement('button')
    btn.textContent = 'Submit Answer'

    btn.addEventListener('click', () => {
        if(input.value) {
            this.submitAnswer(data.nextURL, { answer: input.value })
        }
    })

    element.appendChild(input)
    element.appendChild(btn)
    input.focus()
  }

  /**
   * Renders Radio Buttons for multi-choice questions.
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
    btn.addEventListener('click', () => {
      const selected = form.querySelector('input[name="alt"]:checked')
      if (selected) {
        this.submitAnswer(data.nextURL, { answer: selected.value })
      }
    })

    element.appendChild(form)
    element.appendChild(btn)
  }


  /**
   * Handles the countdown logic
   */
  startTimer () {
    this.questionStartTime = Date.now()
    const timerBar = document.querySelector('#timer-bar')
    const timerContainer = document.querySelector('#timer-container')
    timerContainer.style.display = 'block'
    
    let width = 100
    // Reset any existing timer
    if (this.timerInterval) clearInterval(this.timerInterval)

    this.timerInterval = setInterval(() => {
      width -= 10 // Reduce timer bar width
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
      <button id="restart-btn">Try Again</button>
    `
    this.container.querySelector('#restart-btn').addEventListener('click', () => this.init())
  }

  renderVictory () {
    const timeInSeconds = (this.totalTime / 1000).toFixed(2)
    this.container.innerHTML = `
      <h2 class="success-message">Victory!</h2>
      <p>Well done, ${this.nickname}!</p>
      <p>Total Time: ${timeInSeconds} seconds</p>
      <button id="restart-btn">Play Again</button>
      
      <div id="high-score-list"></div> 
    `
    
    this.container.querySelector('#restart-btn').addEventListener('click', () => this.init())
  }
  
  showMessage(msg, type) {
      const el = this.container.querySelector('#message')
      if(el) {
          el.textContent = msg
          el.className = type === 'error' ? 'error-message' : 'success-message'
      }
  }
}