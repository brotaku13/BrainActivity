
//global variable for the data loaded in from the files
var file_data = {};
var cy = undefined;
var Graph = undefined;

document.addEventListener("DOMContentLoaded", function () {
    //init select field
    


    //get hight/width of container
    let container = document.getElementById('graph-container')
    let dim = container.getBoundingClientRect()

    //initialize graph window and set width/height
    Graph = ForceGraph3D();
    Graph(document.getElementById('3d-graph'))
        .width(dim.width)
        .height(dim.height)

    //init cytoscape
    cy = cytoscape({
        container: document.getElementById('cy')
    });

    //init file-input buttons
    let fileInputs = document.getElementsByClassName('file-input');
    for (i = 0; i < fileInputs.length; i++) {
        fileInputs[i].addEventListener('change', (event) => {

            //get button that was clicked
            let data_name = event.target.name;

            if (data_name !== 'bundle') {
                let file = event.target.files[0];
                if (file) {
                    parseCSV(file, data_name);
                }
            } else {
                //loaded in a bundle of files
                let fileList = event.target.files;
                parseMultiple(fileList, data_name);
            }

        })
    }

    //when create graph is clicked, it inits the graph functions
    document.getElementById('create-graph').addEventListener('click', () => {
        if (file_data.edge_list && file_data.node_ids && file_data.node_names && file_data.coordinates && file_data.weight_matrix) {
            const graph_elements = createGraphElements(file_data);
            buildGraph(Graph, graph_elements);
        } else {
            //must have loaded in the correct data
            alert('You have not loaded the necessary data')
        }
    })

    //toggle particle effects
    document.getElementById('toggle-particles').addEventListener('change', () => {
        PARTICLES = !PARTICLES;
        updateGraph(Graph) //this is required to update the node graph geometries. without this line, the particles will continue to move
        console.log('Value of particles is ', PARTICLES);
    })

    //toggle edge Weight
    document.getElementById('toggle-edge-weights').addEventListener('change', () => {
        EDGE_WEIGHT = !EDGE_WEIGHT;
        updateGraph(Graph) //this is required to update the node graph geometries. without this line, the particles will continue to move
        console.log('Value of edge_weight is ', EDGE_WEIGHT);
    })

    document.getElementById('nodeList').addEventListener('change', (event)=>{
        let nodeId = event.target.value;
        console.log('Chose node ID: ', nodeId);
        focusNode(nodeId);
    })
})
