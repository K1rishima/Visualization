'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let lightModel;
let lightModel2;

let point = [1.0, 1.0]

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function onChangeParams() {
    surface.BufferData(CreateSurfaceData());
    draw()
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.BufferNormals = function (normals) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

    }
    this.BufferTexCoords = function (texCoords) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STREAM_DRAW);

    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
    this.Draw2 = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
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
    let projection = m4.perspective(Math.PI / 8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let dx = parseFloat(document.getElementById('dx').value);
    let dy = parseFloat(document.getElementById('dy').value);
    let dz = parseFloat(document.getElementById('dz').value);
    // let x = parseFloat(document.getElementById('x').value);
    let y = parseFloat(document.getElementById('y').value);
    let z = parseFloat(document.getElementById('z').value);
    gl.uniform3fv(shProgram.iLightDir, [dx, dy, dz]);
    let speed = parseInt(document.getElementById('speed').value)
    let x = 2 * Math.cos(Date.now() * 1 / (10000 - speed));
    gl.uniform3fv(shProgram.iLightPos, [x, y, z]);
    gl.uniform1f(shProgram.iAngle, parseFloat(document.getElementById('angle').value));
    gl.uniform2fv(shProgram.iTranslate, [point[0] / (2 * Math.PI), point[1] / (2 * Math.PI)]);
    gl.uniform1f(shProgram.iDiffusion, parseFloat(document.getElementById('diffusion').value));

    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false,
    m4.multiply(modelViewProjection, m4.translation(...KleinBottle(point[0], point[1]))));
    gl.uniform1f(shProgram.iAngle, -1);
    
    lightModel.Draw();
    // lightModel2.BufferData([0, 0, 0, dx, dy, dz])
    // lightModel2.Draw2();
}

function drawContiniously() {
    draw()
    window.requestAnimationFrame(drawContiniously)
}

let inc_i = 1,
    inc_j = 1;
function CreateSurfaceData() {
    let vertexList = [];

    inc_i = parseInt(document.getElementById('u').value)
    inc_j = parseInt(document.getElementById('v').value)

    for (let i = 0; i < 360; i += inc_i) {
        for (let j = 0; j < 360; j += inc_j) {
            vertexList.push(...KleinBottle(deg2rad(i), deg2rad(j)))
            vertexList.push(...KleinBottle(deg2rad(i + inc_i), deg2rad(j)))
            vertexList.push(...KleinBottle(deg2rad(i), deg2rad(j + inc_j)))
            vertexList.push(...KleinBottle(deg2rad(i), deg2rad(j + inc_j)))
            vertexList.push(...KleinBottle(deg2rad(i + inc_i), deg2rad(j)))
            vertexList.push(...KleinBottle(deg2rad(i + inc_i), deg2rad(j + inc_j)))
        }
    }

    return vertexList;
}
function CreateSurfaceNormals() {
    let normalList = [];

    for (let i = 0; i < 360; i += inc_i) {
        for (let j = 0; j < 360; j += inc_j) {
            normalList.push(...KleinBottleNormal(deg2rad(i), deg2rad(j)))
            normalList.push(...KleinBottleNormal(deg2rad(i + inc_i), deg2rad(j)))
            normalList.push(...KleinBottleNormal(deg2rad(i), deg2rad(j + inc_j)))
            normalList.push(...KleinBottleNormal(deg2rad(i), deg2rad(j + inc_j)))
            normalList.push(...KleinBottleNormal(deg2rad(i + inc_i), deg2rad(j)))
            normalList.push(...KleinBottleNormal(deg2rad(i + inc_i), deg2rad(j + inc_j)))
        }
    }

    return normalList;
}
function CreateSurfaceTexCoords() {
    let textureList = [];

    for (let i = 0; i < 360; i += inc_i) {
        for (let j = 0; j < 360; j += inc_j) {
            textureList.push(i / 360, j / 360)
            textureList.push((i + inc_i) / 360, j / 360)
            textureList.push(i / 360, (j + inc_j) / 360)
            textureList.push(i / 360, (j + inc_j) / 360)
            textureList.push((i + inc_i) / 360, j / 360)
            textureList.push((i + inc_i) / 360, (j + inc_j) / 360)
        }
    }

    return textureList;
}
let a = 5, s = 0.2;
function KleinBottle(u, v) {
    return [s * x(u, v), s * y(u, v), s * z(u, v)]
}
const e = 0.0001;
function KleinBottleNormal(u, v) {
    let u1 = KleinBottle(u, v),
        u2 = KleinBottle(u + e, v),
        v1 = KleinBottle(u, v),
        v2 = KleinBottle(u, v + e);
    const dU = [], dV = []
    for (let i = 0; i < 3; i++) {
        dU.push((u1[i] - u2[i]) / e)
        dV.push((v1[i] - v2[i]) / e)
    }
    const n = m4.normalize(m4.cross(dU, dV))
    return n
}

const { cos, sin } = Math;

function x(u, v) {
    return ((a + cos(u * 0.5) * sin(v) - sin(u * 0.5) * sin(2 * v)) * cos(u));
}
function y(u, v) {
    return ((a + cos(u * 0.5) * sin(v) - sin(u * 0.5) * sin(2 * v)) * sin(u));
}
function z(u, v) {
    return (sin(u * 0.5) * sin(v) + cos(u * 0.5) * sin(2 * v));
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightDir = gl.getUniformLocation(prog, "lightDir");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");
    shProgram.iDiffusion = gl.getUniformLocation(prog, "diffusion");
    shProgram.iTranslate = gl.getUniformLocation(prog, "textTr");
LoadTexture()
    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());
    let normals = CreateSurfaceNormals()
    surface.BufferNormals(normals);
    console.log(CreateSurfaceData().length)
    console.log(CreateSurfaceTexCoords().length)
    surface.BufferTexCoords(CreateSurfaceTexCoords());
    lightModel = new Model()
    lightModel.BufferData(CreateSphere())
    lightModel.BufferNormals(CreateSphere())
    lightModel.BufferTexCoords(CreateSphere())
    lightModel2 = new Model()
    lightModel2.BufferData([0, 0, 0, 1, 1, 1])

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

    drawContiniously();
}


function CreateSphere() {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = sphereVertex(u, v);
            let v2 = sphereVertex(u + 0.1, v);
            let v3 = sphereVertex(u, v + 0.1);
            let v4 = sphereVertex(u + 0.1, v + 0.1);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += 0.1;
        }
        v = 0;
        u += 0.1;
    }
    return vertexList
}

const radius = 0.1;
function sphereVertex(long, lat) {
    return {
        x: radius * Math.cos(long) * Math.sin(lat),
        y: radius * Math.sin(long) * Math.sin(lat),
        z: radius * Math.cos(lat)
    }
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/K1rishima/Visualization/cgw/texture.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}

window.onkeydown = (e) => {
    if (e.keyCode == 87) {
        point[0] = Math.min(point[0] + 0.1, Math.PI * 2);
    }
    else if (e.keyCode == 83) {
        point[0] = Math.max(point[0] - 0.1, 0);
    }
    else if (e.keyCode == 68) {
        point[1] = Math.min(point[1] + 0.1, 2 * Math.PI);
    }
    else if (e.keyCode == 65) {
        point[1] = Math.max(point[1] - 0.1, 0);
    }
}