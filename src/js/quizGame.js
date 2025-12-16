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

    this.nickname = ''
    
    // The starting URL for the quiz
    this.startUrl = 'https://courselab.lnu.se/quiz/question/1'
  }

  /**
   * Initializes the game by showing the start screen.
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
      } 
    })
  }

  /**
   * Starts the game.
   */
  async startGame () {
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
    // 1. Setup the Timer UI
    this.container.innerHTML = `
      <div id="timer-container"><div id="timer-bar"></div></div>
      <h3>Question:</h3>
      <p class="question-text">${data.question}</p>
      <div id="inputs-area"></div>
    `
    const inputsArea = this.container.querySelector('#inputs-area')


    if (data.alternatives) {
      this.renderAlternatives(inputsArea, data)
    } else {
      this.renderTextInput(inputsArea, data)
    }
    
  }
  /**
   * Renders a simple Text Input for open questions.
   */
  renderTextInput (element, data) {
    const input = document.createElement('input')
    input.type = 'text' // sometimes text, sometimes number, usually text is safe
    
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

    // 'data.alternatives' is an object like { "alt1": "answer text", "alt2": "..." }
    for (const [key, value] of Object.entries(data.alternatives)) {
      const label = document.createElement('label')
      label.innerHTML = `
        <input type="radio" name="alt" value="${key}"> 
        ${value}
      `
      // Add click listener to submit immediately on selection (optional UX choice)
      // or just let them select and click a submit button. Let's do a button for safety.
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
   * Sends the answer to the server.
   */
  async submitAnswer (url, answerPayload) {
    
    try {
      const response = await this.api.sendAnswer(url, answerPayload)
      
      // If we get a new link, it's the next question
      if (response.nextURL) {
        this.fetchQuestion(response.nextURL)
      } else {
        // No nextURL? We won!
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

}