/*
    Seminario #1: Dibujar puntos con VBOs
*/

// Shader de vertices
const VSHADER_SOURCE = `
    attribute vec3 posicion;
	attribute vec3 color;
	varying highp vec3 vColor;
    void main(){
        gl_Position = vec4(posicion,1.0);
        gl_PointSize = 10.0;
		vColor = color;
    }
`

// Shader de fragmentos
const FSHADER_SOURCE = `
	varying highp vec3 vColor;
    void main(){
        gl_FragColor = vec4(vColor,1.0);
    }
`
// Globales
const clicks = [];
const colors = [];
let color_buffer;
let bufferVertices;
let colorFragmento;

function main()
{
    // Recupera el lienzo
    const canvas = document.getElementById("canvas");
    const gl = getWebGLContext( canvas );

    // Cargo shaders en programa de GPU
    if(!initShaders(gl,VSHADER_SOURCE,FSHADER_SOURCE)){
        console.log("La cosa no va bien");
    }

    // Color de borrado del lienzo
    gl.clearColor(0.0, 0.3, 0.6, 1.0);

    // Localiza el att del shader posicion
    const coordenadas = gl.getAttribLocation( gl.program, 'posicion');
	const color = gl.getAttribLocation( gl.program, 'color');

    // Crea buffer, etc ...
    bufferVertices = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
    gl.vertexAttribPointer( coordenadas, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( coordenadas );

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	color_buffer = gl.createBuffer ();
	gl.bindBuffer( gl.ARRAY_BUFFER, color_buffer );
	gl.vertexAttribPointer(color, 3, gl.FLOAT, false,0,0) ;
	gl.enableVertexAttribArray(color);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );

    // Registrar la call-back del click del raton
    canvas.onmousedown = function(evento){ click(evento,gl,canvas); };

    // Dibujar
    render( gl );
    
}

function click( evento, gl, canvas )
{
    // Recuperar la posicion del click
    // El click devuelve la x,y en el sistema de referencia
    // del documento. Los puntos que se pasan al shader deben
    // de estar en el cuadrado de lado dos centrado en el canvas

    let x = evento.clientX;
    let y = evento.clientY;
    const rect = evento.target.getBoundingClientRect();

    // Conversion de coordenadas al sistema webgl por defecto
    x = ((x-rect.left)-canvas.width/2) * 2/canvas.width;
    y = ( canvas.height/2 - (y-rect.top)) * 2/canvas.height;
	dist = Math.sqrt(x*x + y*y);
	console.log("x: "+x);
	console.log("y: "+y);

	// Guardar las coordenadas y copia el array
	clicks.push(x); clicks.push(y); clicks.push(0.0);

	colors.push(1-dist); colors.push(1-dist); colors.push(0);
	console.log(colors);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer( gl.ARRAY_BUFFER, bufferVertices );
	// Redibujar con cada click
	render( gl );
}

function render( gl )
{
	// Borra el canvas con el color de fondo
	gl.clear( gl.COLOR_BUFFER_BIT );

	// Rellena el BO activo con las coordenadas y lo manda a proceso
	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(clicks), gl.STATIC_DRAW );
	gl.drawArrays( gl.LINE_STRIP, 0, clicks.length/3 )
	gl.drawArrays( gl.POINTS, 0, clicks.length/3 )
}