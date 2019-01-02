//global variable for the data loaded in from the files
var GRAPH_DATA = {
    ocd: {
        graph: undefined,
        cy: undefined,
        container: undefined,
        titlebar: undefined,
        name: 'ocd'
    },
    con: {
        graph: undefined,
        cy: undefined,
        container: undefined,
        titlebar: undefined,
        name: 'con'
    },
    graphList:[],
    maxValues:{
        orbits:{}
    },
    grids:{
        size: undefined,
        xy: {
            ocd: undefined,
            con: undefined
        },
        xz: {
            ocd: undefined,
            con: undefined
        },
        yz: {
            ocd: undefined,
            con: undefined
        }
    },
    axis: {
        ocd: undefined,
        con: undefined
    },
    nodeSize: 1,
    edgeSize: .1,
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

    //check browser type
    // browserAlert();
    // showTutorial();


    //grab the title bars for each graph to be revealed later
    GRAPH_DATA.ocd.titlebar  = document.getElementById('ocd-title');
    GRAPH_DATA.con.titlebar = document.getElementById('con-title');

    //init color scale
    generateScale(colorScale);

    //get containers for the graphs
    GRAPH_DATA.con.container = document.getElementById('con-graph-container');
    GRAPH_DATA.ocd.container = document.getElementById('ocd-graph-container');

    //init both cytoscape graphs
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
        GRAPH_DATA.edgeSize = event.target.value * .1;
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

    let gridToggles = document.getElementsByClassName('toggle-plane')
    for(let i = 0; i < gridToggles.length; i++){
        gridToggles[i].addEventListener('change', (event)=>{
        
            debugger;
            switch(event.target.id){
                case 'xz-plane':
                    togglePlaneVisibility(GRAPH_DATA.grids.xz);
                    break;
                case 'xy-plane':
                    togglePlaneVisibility(GRAPH_DATA.grids.xy);
                    break;
                case 'yz-plane':
                    togglePlaneVisibility(GRAPH_DATA.grids.yz);
                    break;
                default:
                    break;
            }
        })
    }

    document.addEventListener('keydown', function(event){
        let code = event.keyCode;
        switch(code){
            case 32:  //space
                handleModal(modal);
                break
            case 39:  //right arrow
                handleArrow(GRAPH_DATA.graphList, GRAPH_DATA.maxValues, GRAPH_DATA.orbitColoring, 'right');
                break;
            case 37:  // left arrow
                handleArrow(GRAPH_DATA.graphList, GRAPH_DATA.maxValues, GRAPH_DATA.orbitColoring, 'left');
                break;
            default:
                break;
        }
        
    } );

    document.getElementById('grid-scale').addEventListener('keyup', event =>{
        if(event.keyCode === 13){
            let newScale = document.getElementById('grid-scale').value;
            newScale = Number(newScale)
            changeGridScale(newScale);
        }
    })

    document.getElementById('orbit-modal-text').addEventListener('keyup', event =>{
        if(event.keyCode === 13){
            //run color by code
            var elems = document.getElementById('orbit-modal');
            var modal = M.Modal.getInstance(elems);

            let orbitId = document.getElementById('orbit-modal-text').value;
            colorByOribtControl(Number(orbitId), GRAPH_DATA.graphList, GRAPH_DATA.maxValues);
            modal.close();
        }
    })

})

async function handleModal(modal){
    var elems = document.getElementById('orbit-modal');
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

async function browserAlert(){
    if(browser() !== 'Chrome'){
        var elems = document.getElementById('browser-modal');
        var modal = M.Modal.getInstance(elems);
        modal.open();
    }
}   

async function showTutorial(){
    var elems = document.getElementById('tutorial-modal');
    var modal = M.Modal.getInstance(elems);
    modal.open();
}

function browser() {
    // Return cached result if avalible, else get result then cache it.
    if (browser.prototype._cachedResult)
        return browser.prototype._cachedResult;

    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    return browser.prototype._cachedResult =
        isOpera ? 'Opera' :
        isFirefox ? 'Firefox' :
        isSafari ? 'Safari' :
        isChrome ? 'Chrome' :
        isIE ? 'IE' :
        isEdge ? 'Edge' :
        isBlink ? 'Blink' :
        "Don't know";
}

function togglePlaneVisibility(plane){
    let state = plane.ocd.visible;
    plane.ocd.visible = !state;
    plane.con.visible = !state;
}