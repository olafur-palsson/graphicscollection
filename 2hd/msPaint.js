


const vertexShaderText = `
  attribute vec2 vertexPosition;
  attribute vec3 vertexColor;
  varying vec3 fragmentColor;

  void main() {
    fragmentColor = vertexColor;
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
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

// This is how you get the compile errors of a shader displayed in console
const verifyShaderCompilation = (gl, shader) => {
  const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if ( !ok )
    throw "ShaderCompileError: \n" + gl.getShaderInfoLog(shader)
}

// This is how you get the linking errors of the program displayed in console
const verifyProgramLinking = (gl, program) => {
  const ok = gl.getProgramParameter(program, gl.LINK_STATUS)
  if ( !ok )
    throw "ProgramLinkingError: \n" + gl.getProgramInfoLog(program)
}

const initProgram = (gl) => {

  // Set the background or null color and clear
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  // Create shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

  // Set the source code for the shader
  gl.shaderSource(vertexShader, vertexShaderText)
  gl.shaderSource(fragmentShader, fragmentShaderText)

  // Compile
  gl.compileShader(vertexShader)
  gl.compileShader(fragmentShader)

  // Get shader compile errors displayed in console
  verifyShaderCompilation(gl, vertexShader)
  verifyShaderCompilation(gl, fragmentShader)

  // Create and link the program
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  // Get linking errors
  verifyProgramLinking(gl, program)

  return program
}

const triangleVertices = [
     0.0,  0.5 + 5,  0.0,  1.0, 1.0, 0.0,
    -0.5, -0.5 + 5,  0.0,  0.7, 0.0, 1.0,
     0.5, -0.5 + 5,  0.0,  0.1, 1.0, 0.2
]

const linear = (array, n) => {
  console.log(n)
  return array.length / n / 5
}

const getRadioValue = () => document.querySelector('input[name="method"]:checked').value

const getDrawingMethod = () => {
  const method = getRadioValue()
  switch (method) {
    case 'point':         return [gl.POINTS, 1]
    case 'line':          return [gl.LINES, 2]
    case 'linestrip':     return [gl.LINE_STRIP, 1]
    case 'lineloop':      return [gl.LINE_LOOP, 1]
    case 'triangles':     return [gl.TRIANGLES, 3]
    case 'trianglefan':   return [gl.TRIANGLE_FAN, 1]
    case 'trianglestrip': return [gl.TRIANGLE_STRIP, 1]
    default:              return [gl.POINTS, 1]
  }
}

const convertCharacterToHex = char => {
  if (char > 'f' || char < '0')
    return 'f'
  return char
}

const getColor = () => {
  const colorInput = document.getElementById('color')
  const colorString = colorInput.value.toLowerCase()
  let stableString = ''
  for (let i = 0; i < 6; i++)
    stableString += convertCharacterToHex(colorString[i])
  let red = stableString.substring(0, 2)
  let blue = stableString.substring(2, 4)
  let green = stableString.substring(4, 6)
  return [red, blue, green].map(rgb => parseInt(rgb, 16) / 255)
}

let canvas, gl, program, background

const start = () => {
  canvas = document.getElementById('canvas')
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })
  program = initProgram(gl)
  background = document.getElementById('background')
  gl2d = background.getContext('2d')

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  const positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition')
  const colorAttribLocation    = gl.getAttribLocation(program, 'vertexColor')

  let N_BYTES = Float32Array.BYTES_PER_ELEMENT
  gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, gl.FALSE, 5 * N_BYTES, 0)
  gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 5 * N_BYTES, 2 * N_BYTES)

  gl.enableVertexAttribArray(positionAttribLocation)
  gl.enableVertexAttribArray(colorAttribLocation)

  gl.useProgram(program)

  let vertices = []

  const drawToBackground = () => {
    gl2d.drawImage(canvas, 0, 0)
    gl.globalCompositeOperation = 'source-over'
    vertices = []
  }

  Array.from(document.getElementsByName('method')).forEach(radio => {
    radio.onmousedown = () => {
      drawToBackground()
    }
  })

  const clear = () => {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    requestAnimationFrame(drawToBackground)
  }

  const clearAll = () => {
    gl2d.clearRect(0, 0, background.width, background.height)
    clear()
  }


  let clickHandler = (x, y) => {
    let color = getColor()
    vertices.push(x, y, color[0], color[1], color[2])
    let method = getDrawingMethod()
    render(method[0], linear(vertices, method[1]))
  }

  const render = (drawingMethod, count) => {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    console.log(count)
    gl.drawArrays(drawingMethod, 0, vertices.length / 5)
  }

  const setClickHandler = () => {
    canvas.onmousedown = e => {
      if (e.button > 0) {
        e.preventDefault()
        clearAll()
        return
      }
      const rect = e.target.getBoundingClientRect()
      const x = (e.clientX - rect.left) / 320 - 1
      const y = ((e.clientY - rect.top) / 320 - 1) * -1
      clickHandler(x, y)
    }

  }

  setClickHandler()
}
