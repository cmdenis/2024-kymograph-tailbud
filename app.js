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

function roll1(array, shift) {
    // Function similar to numpy roll, will rotate the array along dimension 1
    // Will cause a bug if matrix is not square!
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

function fCouplingMatrix(mat1, mat2) {
    // Function for the coupling function between the memory variable and the phase variable
    //console.log("mat1 is:", mat1)
    //console.log("mat2 is:", mat2)
    
    return math.add(
        math.multiply(
            math.atan(
                math.multiply(
                    math.subtract(
                        mat2,
                        mat1
                    ),
                    cParam
                )
            ),
            cParam
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



function dphidt(mat1, mat2) {

    // Term for intrinsic frequency
    var intrinsicFrequency = math.multiply(
        fCouplingMatrix(mat2, stableFrequencies),
        2*Math.PI
    )


    // Term with all the neighbor interactions
    var couplingTerm = math.multiply(
        math.add(
            math.map(
                math.subtract(roll0(mat1, 1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll0(mat1, -1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll1(mat1, 1), mat1),
                nearestNeighborCoupling
            ),
            math.map(
                math.subtract(roll1(mat1, -1), mat1),
                nearestNeighborCoupling
            )
        ),
        couplingStrength
    )

    //console.log(couplingTerm)
    //console.log(math.add(intrinsicFrequency, couplingTerm))

    // Add everything and return output
    return math.add(intrinsicFrequency, couplingTerm)
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
            xaxis: {title: "x"}, 
            yaxis: {title: "y"},
            //zmin: 0,
        };
    
        var config = {responsive: true}
        Plotly.react("kymoHeatmap", data, layout, config);
    }
    


    {
        var data = [
            {
                z: mat2,
                type: "heatmap",
                colorscale: "Portland",
                colorbar: {
                    title: "x"
                },
                zmin: 0,
                zmax: 2
            }
          ];
    
        var layout = {
            uirevision:'true',
            xaxis: {title: "x"}, 
            yaxis: {title: "y"},
            //zmin: 0,
        };
    
        Plotly.react("xVarHeatmap", data, layout, config);
    }
    

}



// Initialize matrix
var xl = 100
var yl = 5
var meanFrequency = 10
var rangeFrequency = 0.5

var phasesMatrix = math.multiply(math.random([xl, yl]), 0.2*2*Math.PI)
var xMatrix = math.add(math.ones([xl, yl]), 0.)
var stableFrequencies = math.add(
    math.ones([xl, yl]), 
    math.map(
        math.random([xl, yl]),
        function(x){
            return boxMuller(x, 0.1, 0)
        }
    )
)

console.log(stableFrequencies)
var couplingStrength = 1
var waitingTime = 1
var loop_on = true
var loopPause = false
var rangePhases = 0.3
var noiseAmount = 0.0
var cParam = 8
var dt = 0.015
var alphaParam = 1.
selectCouplingFunction("sine")





async function main(){

    //console.log(phases)

    // Overall loop to make the whole app run
    while (true) {

        


        // Smaller loop to run the simulation
        while (loop_on && !(loopPause)) {
            //console.log("loop on:", loop_on)
            //console.log("loop pause:", loopPause)
            
            // Plotting the main simulation
            await sleep(waitingTime) 
            
            

            //var config = {responsive: true}
            //Plotly.react("mainSim", data, layout, config);

            drawPlots(phasesMatrix, xMatrix)

    

            //console.log("phasesMatrix is:", phasesMatrix)
            dphi = dphidt(phasesMatrix, xMatrix)
            console.log(dphi)
            phasesMatrix = math.add(phasesMatrix, math.multiply(dphi, dt))
            xMatrix = math.add(xMatrix, math.multiply(dxdt(dphi, xMatrix), dt))


            

            
              



        }
    }
}

main()



