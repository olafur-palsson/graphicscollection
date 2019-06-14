import webgl_boiler from './webgl-boilerplate'
const glMatrix = require('gl-matrix')

const vertexShaderText = `
  attribute vec3 vertexPosition;
  attribute vec3 vertexColor;
  varying vec3 fragmentColor;

  uniform mat4 mWorld;
  uniform mat4 mView;
  uniform mat4 mProjection;

  void main() {
    fragmentColor = vertexColor;
    gl_Position = mProjection
    * mView
    * mWorld
    * vec4(vertexPosition, 1.0);
    gl_PointSize = 3.0;
  }
`

const fragmentShaderText = `
  precision mediump float;
  varying vec3 fragmentColor;

  void main() {
    gl_FragColor = vec4(fragmentColor, 1.0);
  }
`

const squareVertices = (x, y, length) => {
  return [
    x + length / 2, 0,  y + 0.02, 1, 1, 1,
    x + length / 2, 0,  y - 0.02, 1, 1, 1,
    x - length / 2, 0,  y - 0.02, 1, 1, 1,
    x - length / 2, 0,  y + 0.02, 1, 1, 1,
  ]
}

const createVertices = state => {
  const computerIsPlaying = document.querySelector('#cpu').checked
  if (!computerIsPlaying) state.computerX = -state.playerX
  const ball = squareVertices(state.ballX, state.ballY, 0.04)
  const playerBat = squareVertices(state.playerX, -0.8, 0.4)
  const computerBat = squareVertices(state.computerX, +0.8, 0.4)
  let vertices = ball.concat(playerBat).concat(computerBat)
  if (state.box) {
    vertices = vertices.concat(squareVertices(state.box.x, state.box.y, 0.2))
  }
  return vertices
}

const triangles = [
  // Ball
  0, 1, 2,
  0, 2, 3,

  // Playerbat
  4, 5, 6,
  4, 6, 7,

  // Opponentbat
  8, 9, 10,
  8, 10, 11,

  // Box stuff
  12, 13, 14,
  12, 14, 15
]

let canvas, gl, program

const start = () => {
  canvas = document.getElementById('canvas')
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })

  const Boilerplate = new webgl_boiler(gl)
  program = Boilerplate.initProgram(vertexShaderText, fragmentShaderText)

  // Gamestate is here
  let gameState = {
    playerX: -0.5,
    computerX: +0.2,
    ballX: 0.0,
    ballY: 0.0,
    ballVelX: 0.1,
    ballVelY: 0.1,
    scorePlayer1: 0,
    scorePlayer2: 0
  }

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(createVertices(gameState)), gl.STATIC_DRAW)

  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW)

  const positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition')
  const colorAttribLocation    = gl.getAttribLocation(program, 'vertexColor')

  let N_BYTES = Float32Array.BYTES_PER_ELEMENT
  gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 0)
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 3 * N_BYTES)

  gl.enableVertexAttribArray(positionAttribLocation)
  gl.enableVertexAttribArray(colorAttribLocation)

  gl.useProgram(program)

  const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
  const matViewUniformLocation = gl.getUniformLocation(program, 'mView')
  const matProjUniformLaction = gl.getUniformLocation(program, 'mProjection')

  const mWorld = new Float32Array(16);
  const mView = new Float32Array(16);
  const mProj = new Float32Array(16);

  glMatrix.mat4.identity(mWorld)

  const positionOfViewer       = [ 0, -3, 0]
  const pointViewerIsLookingAt = [ 0, 0, 0]
  const vectorPointingUp       = [ 0, 0, 5]

  glMatrix.mat4.lookAt(mView, positionOfViewer,  pointViewerIsLookingAt, vectorPointingUp)
  glMatrix.mat4.perspective(mProj, Math.PI * 0.25, canvas.width / canvas.height, 0.1, 1000.0)

  gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, mView)
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
  gl.uniformMatrix4fv(matProjUniformLaction, gl.FALSE, mProj)

  // Bind left/right buttons
  document.onkeydown = keyboardEvent => {
    if (keyboardEvent.key === "ArrowLeft")
      gameState.playerX -= 0.1
    if (keyboardEvent.key === "ArrowRight")
      gameState.playerX += 0.1
  }

  const playerPoints = document.getElementById('pointsPlayer')
  const computerPoints = document.getElementById('pointsComputer')
  const updatePoints = () => {
    playerPoints.innerHTML = gameState.scorePlayer1
    computerPoints.innerHTML = gameState.scorePlayer2
  }

  const scored = (player1) => {
    if (player1) gameState.scorePlayer1 += 1
    else         gameState.scorePlayer2 += 1

    gameState.ballX = 0.0
    gameState.ballY = 0.0

    let velX = 0.0
    let velY = 0.1

    do {
      let random = Math.random() / 7.5 - 0.0666
      velX += random
      console.log(velX)
    } while (Math.abs(velY / velX) > 5 && velY / velX < 1)

    gameState.ballVelX = velX / 2
    gameState.ballVelY = velY / 2

    gameState.box = false

    boxTime = 3000 + time + Math.pow(Math.random() * 130, 2)

    updatePoints()

  }

  const rebound = (x, y) => {
    let batPosition = y > 0 ? gameState.computerX : gameState.playerX
    if (Math.abs(x - batPosition) < 0.2) {
      gameState.ballVelY *= -1
      gameState.ballVelY *= 1.08
      gameState.ballVelX *= 1.12
      return
    }
  }

  const handleBallPosition = () => {
    let x = gameState.ballX
    let y = gameState.ballY

    if (Math.abs(y) >= 0.78) {
      rebound(x, y)
    }

    if (Math.abs(y) >= 0.82) {
      scored(y > 0)
    }

    if (Math.abs(x) >= 1) {
      gameState.ballVelX *= -1
    }
  }

  const moveComputerTowardsBall = timeDifference => {
    let x = gameState.ballX
    let delta = gameState.computerX - x
    let direction = gameState.computerX - x < 0 ? 1 : -1
    let maxMove = gameState.computerX + timeDifference / 10 * direction

    gameState.computerX = Math.abs(delta) < 0.012 ? x : maxMove
  }

  // Initialize rendering loop
  let time = performance.now()
  let boxTime = time + 5000

  const handleBox = newTime => {
    if (gameState.box) {
      if (
        Math.abs(gameState.ballX - gameState.box.x) < 0.1
          &&
        Math.abs(gameState.ballY - gameState.box.y) < 0.02
      ) scored(gameState.ballVelY > 0)
      return
    }

    if (newTime > boxTime) {
      gameState.box = {
        x: (Math.random() * 2 - 1),
        y: (Math.random() / 4 + 0.56)
      }
    }
  }

  const render = (drawingMethod, count) => {
    const newTime = performance.now() + 0.01
    const timeDifference = (newTime - time) / 100.0
    time = newTime

    gameState.ballX += gameState.ballVelX * timeDifference
    gameState.ballY += gameState.ballVelY * timeDifference

    handleBallPosition()
    moveComputerTowardsBall(timeDifference)
    handleBox(newTime)

    const data = new Float32Array(createVertices(gameState))
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.drawElements(gl.TRIANGLES, data.length / 4, gl.UNSIGNED_SHORT, 0)
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

start()
