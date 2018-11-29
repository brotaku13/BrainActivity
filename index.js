//global variable for the data loaded in from the files
var file_data = {
    ocd: {
        onScreen: false
    },
    con: {
        onScreen: false
    }
}

//variable to store the graphs to loop through to apply effects
var graphList = [];
var maxValues = {orbits: {}};

//init the primary grpah objects.
var conCy = undefined;
var conGraph = undefined;

var ocdCy = undefined;
var ocdGraph = undefined;

document.addEventListener("DOMContentLoaded", function () {

    //init dropdown fields
    var elem = document.getElementById('color-by-dropdown');
    var elems = document.querySelectorAll('select')
    var instances = M.FormSelect.init(elems, {});

    //init sidebar
    elems = document.querySelectorAll('.sidenav');
    var instances = M.Sidenav.init(elems, {
        edge: 'right',

    });

    var modalElem = document.querySelectorAll('.modal');
    var modal = M.Modal.init(modalElem, {
        dismissible: true,
        opacity: 0
    });


    //grab the title bars for each graph to be revealed later
    var ocdTitle = document.getElementById('ocd-title');
    var conTitle = document.getElementById('con-title');

    //init color scale
    generateScale(colorScale);

    //get hight/width of container to properly size the graph. 
    let conContainer = document.getElementById('con-graph-container');
    let ocdContainer = document.getElementById('ocd-graph-container');
    file_data.con.container = conContainer;
    file_data.ocd.container = ocdContainer;

    //init both sytoscape graphs
    conCy = cytoscape({
        container: document.getElementById('conCy')
    });
    conCy.linked = false; //not linked means that the graph has not been connected to the 3D graph

    ocdCy = cytoscape({
        container: document.getElementById('ocdCy')
    })
    ocdCy.linked = false;

    //init file-input buttons
    let fileInputs = document.getElementsByClassName('file-input');
    for (i = 0; i < fileInputs.length; i++) {
        fileInputs[i].addEventListener('change', (event) => {
            //get button that was clicked
            let data_name = event.target.name;
            let target = data_name.slice(0, 3);
            data_name = data_name.slice(4, data_name.length);
            if (data_name !== 'bundle') {
                let file = event.target.files[0];
                if (file) {
                    parseCSV(file, data_name, target);
                }
            } else {
                //loaded in a bundle of files
                let fileList = event.target.files;
                parseMultiple(fileList, data_name, target);
            }
            
        })
    }

    //create OCD Graph
    document.getElementById('create-ocd-graph').addEventListener('click', () => {
        let group = file_data.ocd;
        if (group.edge_list && group.node_ids && group.node_names && group.coordinates && group.weight_matrix) {
            //set graph size and turn visible
            if (file_data.con.onScreen) {
                //if the other graph has been shown
                file_data.con.container.classList.remove('s12');
                file_data.con.container.classList.add('s6');
                file_data.ocd.container.classList.add('s6');

                conDim = file_data.con.container.getBoundingClientRect();
                conGraph.width(conDim.width).height(conDim.height);

                //one graph already showing, init second title bar
                conTitle.classList.remove('s12');
                conTitle.classList.add('s6');
                ocdTitle.classList.add('s6');

            } else {
                //other graph not showing
                file_data.ocd.container.classList.add('s12');
                ocdTitle.classList.add('s12')
            }
            
            //make graph div visible
            file_data.ocd.container.classList.remove('hide');
            ocdTitle.classList.remove('hide');

            group.onScreen = true;
            //get new size of container
            let dim = file_data.ocd.container.getBoundingClientRect();

            // Create the Graph
            ocdGraph = ForceGraph3D();
            ocdGraph(document.getElementById('ocd-3d-graph'))
                .width(dim.width)
                .height(dim.height)(document.getElementById('ocd-3d-graph'));

            // add in the elements and build in the features
            const graph_elements = createGraphElements(group);
            buildGraph(ocdGraph, ocdCy, graph_elements, graphList);

            //if other graph has been made, link cameras
            if(file_data.con.onScreen){
                linkCameras(conGraph, ocdGraph);

                //reset the maxValues because now there are two graphs on screen
                maxValues = {orbits: {}};
                colorNodeBy('', graphList, maxValues);
            }

            //add to graphlist
            graphList.push({graph: ocdGraph, cy: ocdCy});

        } else {
            alert('You are missing valuable data')
        }
    })

    //create CON Graph
    document.getElementById('create-con-graph').addEventListener('click', () => {
        let group = file_data.con;
        if (group.edge_list && group.node_ids && group.node_names && group.coordinates && group.weight_matrix) {
            //set graph size and turn visible
            if (file_data.ocd.onScreen) {
                //if the other graph has been shown; resize
                file_data.ocd.container.classList.remove('s12');
                file_data.ocd.container.classList.add('s6');
                file_data.con.container.classList.add('s6');

                ocdDim = file_data.ocd.container.getBoundingClientRect();
                ocdGraph.width(ocdDim.width).height(ocdDim.height);

                ocdTitle.classList.remove('s12');
                ocdTitle.classList.add('s6');
                conTitle.classList.add('s6');

            } else {
                //other graph not showing
                file_data.con.container.classList.add('s12');
                conTitle.classList.add('s12');
            }

            file_data.con.container.classList.remove('hide');
            conTitle.classList.remove('hide');

            group.onScreen = true;
            //get new size of container
            let dim = file_data.con.container.getBoundingClientRect();

            conGraph = ForceGraph3D();
            conGraph(document.getElementById('con-3d-graph'))
                .width(dim.width)
                .height(dim.height)(document.getElementById('con-3d-graph'));


            const graph_elements = createGraphElements(group);
            buildGraph(conGraph, conCy, graph_elements, graphList);

            //if other graph has been made, link cameras and reset maxValues
            if(file_data.ocd.onScreen){
                linkCameras(conGraph, ocdGraph);
                
                //reset the maxValues because now there are two graphs on screen
                maxValues = {orbits: {}};
                colorNodeBy('', graphList, maxValues);
            }

            //add to graph list for functions
            graphList.push({graph: conGraph, cy: conCy});

        } else {
            alert('You are missing valuable data')
        }
    })

    //toggle particle effects
    document.getElementById('toggle-particles').addEventListener('change', () => {
        PARTICLES = !PARTICLES;
        updateGraph(graphList); //this is required to update the node graph geometries. without this line, the particles will continue to move
    })

    //toggle edge Weight
    document.getElementById('toggle-edge-weights').addEventListener('change', () => {
        EDGE_WEIGHT = !EDGE_WEIGHT;
        updateGraph(graphList) //this is required to update the node graph geometries. without this line, the particles will continue to move
    })

    //set listener for focus node dropdown
    document.getElementById('nodeList').addEventListener('change', (event) => {
        let nodeId = event.target.value;
        if (file_data.ocd.onScreen && file_data.con.onScreen) {
            focusNode(nodeId, conGraph, conCy);
        } else if (file_data.ocd.onScreen && !file_data.con.onScreen) {
            focusNode(nodeId, ocdGraph, ocdCy);
        } else if (!file_data.ocd.onScreen && file_data.con.onScreen) {
            focusNode(nodeId, conGraph, conCy);
        } else {
            alert('No Graphs Displayed')
        }
    })

    document.getElementById('color-by-dropdown').addEventListener('change', event => {
        let colorIndex = event.target.value;
        if(colorIndex !== 'orbit_frequency'){
            colorNodeBy(colorIndex, graphList, maxValues);
            document.getElementById('orbit-input').classList.add('hide');
        } else {
            //if asking to color by orbit frequency, require additional information
            document.getElementById('orbit-input').classList.remove('hide');
        }
    })

    document.getElementById('edge-size').addEventListener('change', (event) => {
        console.log(event.target.value);
        EDGE_SCALE = event.target.value;
        updateGraph(graphList);
    })

    document.getElementById('node-size').addEventListener('change', (event) => {
        console.log(event.target.value);
        NODE_SCALE = event.target.value;
        updateGraph(graphList);
    })

    document.getElementById('color-by-orbit').addEventListener('click', event =>{
        let orbitId = document.getElementById('orbit-number').value;
        colorByOribtControl(orbitId, graphList, maxValues);
    })

    document.addEventListener('keydown', function(event){
        let code = event.keyCode;
        switch(code){
            case 32:  //space
                handleModal(modal);
                break
            case 39:  //right arrow
                handleArrow(graphList, maxValues, ORBIT_COLORING, 'right');
                break;
            case 37:  // left arrow
                handleArrow(graphList, maxValues, ORBIT_COLORING, 'left');
                break;
            default:
                break;
        }
        
    } );

    document.getElementById('orbit-modal-text').addEventListener('keyup', event =>{
        if(event.keyCode === 13){
            //run color by code
            var elems = document.getElementById('modal1');
            var modal = M.Modal.getInstance(elems);

            let orbitId = document.getElementById('orbit-modal-text').value;
            colorByOribtControl(Number(orbitId), graphList, maxValues);
            modal.close();
        }
    })

})

async function handleModal(modal){
    var elems = document.getElementById('modal1');
    var modal = M.Modal.getInstance(elems);

    if(!modal.isOpen){
        modal.open();
        var textBox = document.getElementById('orbit-modal-text');
        textBox.value = '';
        textBox.focus();
    } else {
        modal.close();
    }
}

async function handleArrow(graphList, maxValues, currentOrbitId, arrow){
    debugger;
    if(currentOrbitId == null){
        //not currently colored by orbits - start at 0
        colorByOribtControl(0, graphList, maxValues);
    } else if(arrow == 'right'){
        //increment orbit id and color by that
        colorByOribtControl(currentOrbitId + 1, graphList, maxValues);
    } else if (arrow == 'left'){
        //decrement orbit id and color by that
        colorByOribtControl(currentOrbitId - 1, graphList, maxValues);
    }
}