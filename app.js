// returns a gaussian random function with the given mean and stdev.
function boxMuller(val1, scale, shift) {
    var val2 = Math.random()
    var z1 = Math.sqrt(-2*Math.log(val1))*Math.cos(2*Math.PI*val2)
    var z2 = Math.sqrt(-2*Math.log(val1))*Math.sin(2*Math.PI*val2)
    return z1*scale + shift
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function roll0(array, shift) {
    // Function similar to numpy roll, will rotate the array along dimension 0
    const length = array.length;
    const result = new Array(length);
  
    for (let i = 0; i < length; i++) {
      result[(i + shift + length) % length] = array[i];
    }
  
    return result;
}

function roll_up(array) {
    const result = math.transpose(array.slice(0))
    result.splice(result.length-1)
    return math.transpose(math.concat([result[0]], result, 0))

}

function roll_down(array) {
    const result = math.transpose(array.slice(0))
    result.splice(0, 1)
    return math.transpose(math.concat(result, [result[result.length - 1]], 0))

}

function roll_left(array) {
    const result = array.slice(0)
    result.splice(result.length-1)
    return math.concat([result[0]], result, 0)

}

function roll_right(array) {
    const result = array.slice(0)
    result.splice(0, 1)
    return math.concat(result, [result[result.length - 1]], 0)

}


function roll1(array, shift) {
    // Function similar to numpy roll, will rotate the array along dimension 1
    const length = array[1].length;
    const result = new Array(length);
  
    for (let i = 0; i < length; i++) {
      result[(i + shift + length) % length] = math.transpose(array)[i];
    }
  
    return math.transpose(result);
}

// testing to delete
//var mat = math.random([2, 5])
//console.log(mat)
//console.log(roll1(mat, 1))

function fCoupling(x, freq) {
    // Function for the coupling function between the memory variable and the phase variable
    return Math.atan(cParam*(1-x))/cParam + x
}

function fCouplingMatrix(mat1, matfreq) {
    // Function for the coupling function between the memory variable and the phase variable
    return math.add(
        math.multiply(
            math.atan(
                math.multiply(
                    math.subtract(
                        matfreq,
                        mat1
                    ),
                    cParam
                )
            ),
            1/cParam
        ),
        mat1
    )
}


// Define coupling function that will be overwritten by the selector box on the website
function nearestNeighborCoupling(x) {
    return Math.sin(x)
}

function selectCouplingFunction(choice) {
    // Function to select which coupling function to use in the system
    if (choice == "sine") {
        nearestNeighborCoupling = Math.sin
    } else if (choice == "cosine") {
        nearestNeighborCoupling == Math.cos
    } else if (choice == "rectified") {
        nearestNeighborCoupling = function (x) {
            return Math.max(0, Math.sin(x))
        }
    } else if (choice == 1) {
        nearestNeighborCoupling = function () {
            return 1.0
        }
    } else {
        console.log("Error: coupling function not defined")
    }
    
}

function dphidt(mat1, mat2, stableFrequencies, time) {

    // Term for intrinsic frequency
    var intrinsicFrequency = math.multiply(
        fCouplingMatrix(mat2, stableFrequencies),
        2*Math.PI
    )


    // Term with all the neighbor interactions
    var couplingTerm = math.multiply(
        math.add(
            math.map(
                math.subtract(roll_up(mat1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll_down(mat1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll_left(mat1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll_right(mat1), mat1),
                nearestNeighborCoupling
            )
        ),
        couplingStrength
    )

    var entrainmentTerm = math.multiply(
        math.sin(
            math.add(mat1, -time*pulseFrequency)
        ),
        pulseStrength
    )


    // Add everything and return output
    return math.add(intrinsicFrequency, couplingTerm, entrainmentTerm)
}

function dxdt(dmat1, mat2) {
    return math.multiply(
        math.subtract(
            math.multiply(
                dmat1,
                1/(2*Math.PI)
            ),
            mat2
        ),
        alphaParam
    )
}

function drawPlots(mat1, mat2){
    // Function to draw the heatmaps
    {
        var data = [
            {
              z: math.mod(mat1, 2*math.PI),
              type: "heatmap",
              colorscale: "Portland",
              colorbar: {
                title: "Phase"
              },
              zmin: 0,
              zmax: 2*Math.PI
            }
          ];
    
        var layout = {
            uirevision:'true',
            xaxis: {title: "time"}, 
            yaxis: {title: "y"},
            //zmin: 0,
            margin: {
                t: 20,
                b: 40,
                l: 60,
                r: 50,
              }
        };
    
        var config = {responsive: true}
        Plotly.react("kymoHeatmap", data, layout, config);
    }
    

    // x variable
    {
        var data = [
            {
                z: mat2,
                type: "heatmap",
                colorscale: "YlGnBu",
                colorbar: {
                    title: "x"
                },
                //zmin: 0.5,
                //zmax: 1.4
            }
          ];
    
        var layout = {
            uirevision:'true',
            xaxis: {title: "time"}, 
            yaxis: {title: "y"},
            //zmin: 0,
            margin: {
                t: 10,
                b: 40,
                l: 60,
                r: 30,
              }
        };
    
        Plotly.react("xVarHeatmap", data, layout, config);
    }
    

}


// Parameters
var maxFreq = 1.5               // Maximum frequency of the frequency gradient
var minFreq = 0.7               // Minimum frequency of the frequency gradient
var couplingStrength = 1.4      // Coupling strength between neighboring sites
var xl = 100                    // size in x
var yl = 5                      // size in y
var rangeFrequency = 0.0        // Standard deviation
var rangePhases = 0.3           // range of phases randomly selected in the initial conditions
var noiseAmount = 2           // amount of noise in simulation
var cParam = 25                  // c parameter in the coupling function
var alphaParam = 1.             // alpha parameter for the memory variable
selectCouplingFunction("sine")  // select initial coupling function
var pulseStrength = 1.6           // coupling strenght of the pulses
var pulseFrequency = 10  // Frequency of the perturbation




// Meta parameters
var waitingTime = 1
var loop_on = false
var loopPause = false
var dt = 0.01    
var currentTime = 0.0              








async function main(){

    // Overall loop to make the whole app run
    while (true) {

        // If paused, stuck in this
        while (loopPause) {
            await sleep(10)
        }

        // Only re-initialize everything if a reset is detected
        if (loop_on == false) {
            // Initialize phase matrix
            var phasesMatrix = math.multiply(math.random([xl, yl]), rangePhases*2*Math.PI)

            // Initialize x matrix
            var xMatrix = math.add(math.ones([xl, yl]), 0.)

            // Initialize phase gradient
            var frequencyGradient = Array(xl).fill(1).map((i, j) => j/(xl-1)*(minFreq - maxFreq) + maxFreq)
            var stableFrequencies = [frequencyGradient]

            //console.log(stableFrequencies)
            
            for (let i = 1; i < yl; i++) {
                stableFrequencies = math.concat(stableFrequencies, [frequencyGradient], 0)
            }
            stableFrequencies = math.transpose(stableFrequencies)
            stableFrequencies = math.add(   // add some initial noise
                stableFrequencies, 
                math.map(
                    math.random([xl, yl]),
                    function(x){
                        return boxMuller(x, rangeFrequency, 0)
                    }
                )
            )

            // Initializing kymo graphs
            var kymoGraph = [math.transpose(phasesMatrix)[2]]
            var kymoFrequency = [math.transpose(xMatrix)[2]]
        }

        await sleep(waitingTime) 
    
        loop_on = true

        // Smaller loop to run the simulation
        while (loop_on && !(loopPause)) {
            //console.log("loop on:", loop_on)
            //console.log("loop pause:", loopPause)
            
            // Plotting the main simulation
            await sleep(waitingTime) 
            currentTime += dt
            drawPlots(math.transpose(kymoGraph), math.transpose(kymoFrequency))

            // Time evolve the system
            dphi = dphidt(phasesMatrix, xMatrix, stableFrequencies, currentTime)    // derivative of phi
            phasesMatrix = math.add(
                phasesMatrix, 
                math.multiply(
                    math.add(
                        math.multiply(math.add(math.random([xl, yl]), -0.5), 2*noiseAmount),
                        dphi
                    ), 
                    dt
                )
            )  // update the phase array

            xMatrix = math.add(xMatrix, math.multiply(dxdt(dphi, xMatrix), dt)) // update the x (memory) array

            // Append a cross section of the phase array to make kymo graph
            kymoGraph = math.concat(kymoGraph, [math.transpose(phasesMatrix)[2]], 0)
            kymoFrequency = math.concat(kymoFrequency, [math.transpose(xMatrix)[2]], 0)
        }
    }
}

main()



