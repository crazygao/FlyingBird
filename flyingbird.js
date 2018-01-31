// attributes: <- from buffer, buffer ->(calc shaders) -> buffer v2  ->(calc shaders) -> buffer v3
// uniforms: <- global variants.
// varying lowp vect4 ?: fragment shader -> SHOULD BE ALWAYS at global scope
const vsSource=`
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vColor = aVertexColor;
    }
`;
const fsSource = `
    varying lowp vec4 vColor;
    void main() {
        gl_FragColor = vColor;
    }
`;
var squareRotation = 0.0;

main();
function main() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
    const buffers = initBuffers(gl);

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        }
    };
    
    var then = 0;

    var then = 0;
    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

// gl.createShader(); create a new shader
// gl.shaderSource(); source code -> shader
// gl.compileShader(); comple source code  -> gl.COMPILE_STATUS
// gl.getShaderInfoLog(); get last step logs
// gl.createProgram();
// gl.attachShader();
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    //Error: if not initialized alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    //Error: if not compiled, error!
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
// gl.getAttribLocation();  program bind attribute.
// gl.getUniformLocation(); program bind Uniform

// About buffer:
// gl.createBuffer: bind buffer gl.ARRAY_BUFFER
// gl.bufferData: 
function initBuffers(gl) {
    // create a buffer for the squares position
    const positionBuffer = gl.createBuffer();
    // select the positionBUffer as the one to apply buffer operation to from here out
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Now create an array of positions for the square.
    const positions = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    // pass the list of positions into WebGL to build the shape.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Another color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const colors = [
        1.0, 1.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
    };
}

// Matrix push and pop
var mvMatrixStack = [];
function mvPushMatrix(m) {
    if(m) {
        mvMatrixStack.push(m.slice());
        mvMatrix = m.slice();
    } else {
        mvMatrixStack.push(mvMatrix.slice());
    }
}

function mvPopMatrix() {
    if (!mvMatrixStack.length) {
        //ERROR
    } else {
        mvMatrix = mvMatrixStack.pop();
        return mvMatrix;
    }
}

function mvRotate(angle, v) {
    var inRadius = angle * Math.PI / 180.0;
    var m = Matrix.Ro
}

// gl.drawArrays: draw 2D programs
// gl.drawElemnts: draw 3D elements
function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black, fully opaque
    gl.clearDepth(1.0); // clear everything
    gl.enable(gl.DEPTH_TEST); // enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    // clear before draw.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // create a perspective matrix, special matrix that is used
    // to simulate the istortion of perspective in a camera
    // Field of view -> 45 degree
    // WIDTH/HEIGHT -> display size
    // DEPTH -> 0.1~100 units

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    // glmatrix.js
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, squareRotation, [0, 0, 1]);
    // Tell webgl how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit float
        const normalize = false;  // don't normalize
        const stride = 0          // how many bytes to get from one set of values to the next
                                  // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    // Tell webgl how to pull out the colors from the color buffer
    // buffer into the vertexColor attribute.
    {
        const numComponents = 4;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit float
        const normalize = false;  // don't normalize
        const stride = 0          // how many bytes to get from one set of values to the next
                                  // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }

    squareRotation += deltaTime;
}