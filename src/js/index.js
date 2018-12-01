//global variable for the data loaded in from the files
var GRAPH_DATA = {
    ocd: {
        graph: undefined,
        cy: undefined,
        container: undefined,
        titlebar: undefined
    },
    con: {
        graph: undefined,
        cy: undefined,
        container: undefined,
        titlebar: undefined
    },
    graphList:[],
    maxValues:{
        orbits:{}
    },
    nodeSize: 1,
    edgeSize: 1,
    particles: false,
    edgeWeightToggled: false,
    orbitColoring: null,
    highlightedNode: null,
    nodeListgenerated: false
}

var config = undefined;

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
    GRAPH_DATA.ocd.titlebar  = document.getElementById('ocd-title');
    GRAPH_DATA.con.titlebar = document.getElementById('con-title');

    //init color scale
    generateScale(colorScale);

    //get containers for the graphs
    GRAPH_DATA.con.container = document.getElementById('con-graph-container');
    GRAPH_DATA.ocd.container = document.getElementById('ocd-graph-container');

    //init both sytoscape graphs
    ['ocd', 'con'].forEach(name =>{
        GRAPH_DATA[name].cy = cytoscape({
            container: document.getElementById(name + 'Cy')
        });
        GRAPH_DATA[name].cy.linked = false;
    })

    //load in data and then create the graphs
    loadDataController()

    //toggle particle effects
    document.getElementById('toggle-particles').addEventListener('change', () => {
        GRAPH_DATA.particles = !GRAPH_DATA.particles
        updateGraph(GRAPH_DATA.graphList);
    })

    //toggle edge Weight
    document.getElementById('toggle-edge-weights').addEventListener('change', () => {
        GRAPH_DATA.edgeWeightToggled = !GRAPH_DATA.edgeWeightToggled
        updateGraph(GRAPH_DATA.graphList);
    })

    //set listener for focus node dropdown
    document.getElementById('nodeList').addEventListener('change', (event) => {
        let nodeId = event.target.value;
        focusNode(nodeId, GRAPH_DATA.con.graph, GRAPH_DATA.con.cy);
    })

    document.getElementById('color-by-dropdown').addEventListener('change', event => {
        let colorIndex = event.target.value;
        if(colorIndex !== 'orbit_frequency'){
            colorNodeBy(colorIndex, GRAPH_DATA.graphList, GRAPH_DATA.maxValues);
            document.getElementById('orbit-input').classList.add('hide');
        } else {
            //if asking to color by orbit frequency, require additional information
            document.getElementById('orbit-input').classList.remove('hide');
        }
    })

    document.getElementById('edge-size').addEventListener('change', (event) => {
        GRAPH_DATA.edgeSize = event.target.value;
        updateGraph(GRAPH_DATA.graphList);
    })

    document.getElementById('node-size').addEventListener('change', (event) => {
        GRAPH_DATA.nodeSize = event.target.value;
        updateGraph(GRAPH_DATA.graphList);
    })

    document.getElementById('color-by-orbit').addEventListener('click', event =>{
        let orbitId = document.getElementById('orbit-number').value;
        colorByOribtControl(Number(orbitId), GRAPH_DATA.graphList, GRAPH_DATA.maxValues);
    })

    document.addEventListener('keydown', function(event){
        let code = event.keyCode;
        switch(code){
            case 32:  //space
                handleModal(modal);
                break
            case 39:  //right arrow
                handleArrow(GRAPH_DATA.graphList, GRAPH_DATA.maxValues, ORBIT_COLORING, 'right');
                break;
            case 37:  // left arrow
                handleArrow(GRAPH_DATA.graphList, GRAPH_DATA.maxValues, ORBIT_COLORING, 'left');
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
            colorByOribtControl(Number(orbitId), GRAPH_DATA.graphList, GRAPH_DATA.maxValues);
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