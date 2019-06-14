
const glMatrix = require('gl-matrix')

import easyWebGL from './easyWebGL'
import { pyramid } from './objects'
import { createRandomColors } from './colorGenerator'

let canvas, gl, program
const N_BYTES = Float32Array.BYTES_PER_ELEMENT

const start = () => {
  console.log('Something')
  canvas = document.getElementById('canvas')
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
  const EasyGL = new easyWebGL(gl, 'full3d', 'basic')
  program = EasyGL.initProgram()

  const { positionAttribLocation, colorAttribLocation } = EasyGL.getAttribLocations()

  let data = pyramid
  console.log(pyramid)

  gl.enable(gl.DEPTH_TEST)

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)

  gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 0)
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * N_BYTES, 3 * N_BYTES)
  gl.enableVertexAttribArray(positionAttribLocation)
  gl.enableVertexAttribArray(colorAttribLocation)
  gl.useProgram(program)

  // Get the location of the matrices from the shader
  const matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld')
  const matViewUniformLocation = gl.getUniformLocation(program, 'mView')
  const matProjUniformLocation = gl.getUniformLocation(program, 'mProjection')

  // Create arrays containing the actual matrices
  const mWorld      = new Float32Array(16)
  const mView       = new Float32Array(16)
  const mProjection = new Float32Array(16)

  // Identity matrix since we want it to be at center
  glMatrix.mat4.identity(mWorld)

  // Setup the camera matrix
  let positionOfViewer         = [ 0, -3, 0]
  const pointViewerIsLookingAt = [ 0,  0, 0]
  const vectorPointingUp       = [ 0,  0, 5]
  glMatrix.mat4.lookAt(mView, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp)

  // Black magic
  // Most likely f(output, cameraWidthAngle, aspectRatio, closestRenderedPoint, furthestRenderedPoint)
  glMatrix.mat4.perspective(mProjection, Math.PI * 0.25, canvas.width / canvas.height, 0.1, 1000.0)

  // Set the mView in the shader to be the matrix we made
  gl.uniformMatrix4fv(matViewUniformLocation,  gl.FALSE, mView)
  gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
  gl.uniformMatrix4fv(matProjUniformLocation,  gl.FALSE, mProjection)

  let angle = 0
  let identityMatrix = glMatrix.mat4.identity(new Float32Array(16))
  let rotationMatrix = new Float32Array(16)
  let oldMWorld = new Float32Array(16)

  let state = {
    clickX: 0.1,
    clickY: 0.1,
    x0: 0.1,
    y0: 0,
    x: 0,
    y: 0,
    axis: [0, 1, 0],
    radPerSec: 0,
    nextSpeed: 0,
    lastTime: performance.now(),
    staticMWorld: false,
  }

  let wait = false

  setInterval(() => {
    wait = false
  }, 20)

  const updateRotationInfo = e => {
    let {x0, y0, x, y} = state
    let axis = [(y - y0) / (0.001 + (x - x0)), 0, 1] 
    if (x < x0) {
      axis[2] *= -1
      axis[0] *= -1
    }
    state.axis = axis
    let length2 = Math.pow(y - y0, 2) + Math.pow(x - x0, 2)
    const currentTime = performance.now()
    const timeDifference = currentTime - state.lastTime
    state.nextSpeed = Math.sqrt(length2) / timeDifference / 5
    state.lastTime = currentTime
  }

  const rotate = angle => {
    if (state.staticMWorld) {
      let length2 = Math.pow(state.x - state.x0, 2) + Math.pow(state.y - state.y0, 2)
      let offset = Math.sqrt(length2) / 300
      glMatrix.mat4.rotate(rotationMatrix, identityMatrix, offset, state.axis)
      glMatrix.mat4.mul(mWorld, rotationMatrix, mWorld)
      glMatrix.mat4.lookAt(mView, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp)
    } else {
      glMatrix.mat4.rotate(rotationMatrix, identityMatrix, angle / 17 * state.radPerSec, state.axis)
      glMatrix.mat4.mul(mWorld, rotationMatrix, mWorld)
      glMatrix.mat4.lookAt(mView, positionOfViewer, pointViewerIsLookingAt, vectorPointingUp)
    }
  }

  canvas.onmousedown = e => {
    state.staticMWorld = true
    glMatrix.mat4.mul(oldMWorld, identityMatrix, mWorld)
    canvas.onmousemove = e => {
      state.x0 = state.x
      state.y0 = state.y
      state.x = e.offsetX
      state.y = e.offsetY
      if (!wait) updateRotationInfo(e)
    }
  }

  document.onmouseup = e => {
    canvas.onmousemove = null
    state.radPerSec = state.nextSpeed
    state.staticMWorld = false
  }


  let lastTime = performance.now()
  console.log("Number of vertices " + data.length / 6)

  const render = () => {
    let currentTime = performance.now()
    let deltaTime = currentTime - lastTime
    lastTime = currentTime
    let angle = deltaTime / 20 * Math.PI
    rotate(angle)
    gl.uniformMatrix4fv(matViewUniformLocation,  gl.FALSE, mView)
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, mWorld)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

start()
