'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let light;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.LoadNormals = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let p = 2;
    let projection = m4.orthographic(-p, p, -p, p, -p, p);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, 0);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [...hexToRgb(document.getElementById('cs').value), 1]);
    gl.uniform3fv(shProgram.iColorLight, hexToRgb(document.getElementById('cl').value));
    gl.uniform3fv(shProgram.iLightPosition, [2 * Math.cos(Date.now() * 0.001), 2 * Math.sin(Date.now() * 0.001), 0.1]);

    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(2 * Math.cos(Date.now() * 0.001), 2 * Math.sin(Date.now() * 0.001), 0.1)));
    gl.uniform3fv(shProgram.iLightPosition, [0, 0, 0]);
    light.Draw();
}

function repeatDraw() {
    draw()
    window.requestAnimationFrame(repeatDraw)
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return [
        parseInt(result[1], 16) / 256,
        parseInt(result[2], 16) / 256,
        parseInt(result[3], 16) / 256
    ]
}

function CreateSurfaceData() {
    let vertexList = [];
    let uSteps = 100;
    let vSteps = 100;
    let uInc = 2 / uSteps;
    let vInc = 0.8 / vSteps;
    for (let u = -1; u < 1; u += uInc) {
        for (let v = 0.2; v < 1; v += vInc) {
            vertexList.push(...vertex(u, v))
            vertexList.push(...vertex(u + uInc, v))
            vertexList.push(...vertex(u, v + vInc))
            vertexList.push(...vertex(u, v + vInc))
            vertexList.push(...vertex(u + uInc, v))
            vertexList.push(...vertex(u + uInc, v + vInc))
        }
    }

    return vertexList;
}
function CreateNormals() {
    let vertexList = [];
    let uSteps = 100;
    let vSteps = 100;
    let uInc = 2 / uSteps;
    let vInc = 0.8 / vSteps;
    for (let u = -1; u < 1; u += uInc) {
        for (let v = 0.2; v < 1; v += vInc) {
            vertexList.push(...normal(u, v))
            vertexList.push(...normal(u + uInc, v))
            vertexList.push(...normal(u, v + vInc))
            vertexList.push(...normal(u, v + vInc))
            vertexList.push(...normal(u + uInc, v))
            vertexList.push(...normal(u + uInc, v + vInc))
        }
    }

    return vertexList;
}
const { pow } = Math
function vertex(u, v) {
    let x = (-3 * u - pow(u, 5) + 2 * pow(u, 3) * pow(v, 2) + 3 * u * pow(v, 4)) / (6 * (pow(u, 2) + pow(v, 2)))
    let y = (-3 * v - 3 * pow(u, 4) * v - 2 * pow(u, 2) * pow(v, 3) + pow(v, 5)) / (6 * (pow(u, 2) + pow(v, 2)))
    return [x, y, u]
}
const e = 0.001;
function normal(u, v) {
    let uv = vertex(u, v)
    let ue = vertex(u + e, v)
    let ve = vertex(u, v + e)
    const dU = [(uv[0] - ue[0]) / e, (uv[1] - ue[1]) / e, (uv[2] - ue[2]) / e]
    const dV = [(uv[0] - ve[0]) / e, (uv[1] - ve[1]) / e, (uv[2] - ue[2]) / e]
    return m4.normalize(m4.cross(dU, dV))
}

function CreateSphereSurfaceData() {
    let vertexList = [];
    let u = 0;
    let v = 0;
    let u1 = 0.1;
    let v1 = 0.1
    let v0 = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let a = CreateSphereVertex(u, v);
            let b = CreateSphereVertex(u + u1, v);
            let c = CreateSphereVertex(u, v + v1);
            let d = CreateSphereVertex(u + u1, v + v1);
            vertexList.push(a.x, a.y, a.z);
            vertexList.push(b.x, b.y, b.z);
            vertexList.push(c.x, c.y, c.z);
            vertexList.push(c.x, c.y, c.z);
            vertexList.push(b.x, b.y, b.z);
            vertexList.push(d.x, d.y, d.z);
            v += v1;
        }
        v = v0;
        u += u1;
    }
    return vertexList
}
function CreateSphereVertex(long, lat, radius = 0.1) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iColorLight = gl.getUniformLocation(prog, "lightColor");
    shProgram.iLightPosition = gl.getUniformLocation(prog, "lightPosition");

    surface = new Model('Surface');
    light = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    surface.LoadNormals(CreateNormals());
    light.BufferData(CreateSphereSurfaceData())
    light.LoadNormals(CreateSphereSurfaceData())

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
    repeatDraw();
}
