

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
  gl.clearColor(0.5, 0.5, 0.6, 1.0)
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
