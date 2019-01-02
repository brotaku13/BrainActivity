
function buildGraphsController(){
    return Promise.all([
        //load in both graphs
        createGraph('con', document.getElementById('con-3d-graph')),
        createGraph('ocd', document.getElementById('ocd-3d-graph'))
    ]).then(()=>{
        //link the cameras
        linkCameras(GRAPH_DATA.graphList);
    }).then(()=>{
        moveCamera({
            x:3483.2716478988627,
            y:519.0993746047867,
            z:-341.59668085257516
        }, GRAPH_DATA.ocd.graph, {
            x: 2498.814685349418,
            y: 372.38931428175607,
            z:-245.05318242862967
        })
    })
    .then(()=>{
        //enable menu button

        //show tutorial

    })
}

function createGraph(graphName, container){
    return new Promise((resolve, reject) =>{
        //remove hidden quality
        GRAPH_DATA[graphName].container.classList.remove('hide');
        GRAPH_DATA[graphName].titlebar.classList.remove('hide');

        //get new size of container
        let dim = GRAPH_DATA[graphName].container.getBoundingClientRect();

        //create the 3D-Graph Object and resize it to fit container
        let graph = ForceGraph3D();
        graph(container).width(dim.width).height(dim.height);
        GRAPH_DATA[graphName].graph = graph

        //add in elements and build features
        let elements = createGraphElements(GRAPH_DATA[graphName]);
        buildGraph(GRAPH_DATA[graphName].graph, GRAPH_DATA[graphName].cy, elements, GRAPH_DATA.graphList)

        addGrids(elements, 2, graph, graphName)
        // removeGrids(graph);

        //add graph to graphList
        GRAPH_DATA.graphList.push({graph: GRAPH_DATA[graphName].graph, cy: GRAPH_DATA[graphName].cy});
        resolve()
    })
}

/**
 * creates the graph elements from the data loaded in from the file. Requires
 * Node Name, Node IDs, Edge Weight Matrix, Edge List, and node Coordinates
 * @param {Object} group_data Data loaded in from file
 */
function createGraphElements(group_data){
    let num_nodes = group_data.node_ids.length;
    let node_list = []
    
    //setting nodes
    for(i = 0; i < num_nodes; i++){
        let node_name = group_data.node_names[i][0];
        let id = group_data.node_ids[i][0];
        let coordinates = group_data.coordinates[i];
        node_list.push({
            name: node_name,
            id: id - 1,
            fx: coordinates[0] * config.spacingScale,
            fy: coordinates[1] * config.spacingScale,
            fz: coordinates[2] * config.spacingScale,
            orbits: group_data.orbits ? group_data.orbits[i] : [],
            color: config.color.node.base,
            selected: true,
            scaledColor: {orbits:{}}
        })
    }
    
    //setting edges. Called "links" in this particular library
    let num_edges = group_data.edge_list.length;
    let edge_list= [];
    for(i = 0; i < num_edges; i++){
        let edge = group_data.edge_list[i];
        edge_list.push({
            source: edge[0],
            target: edge[1],
            value: group_data.weight_matrix[edge[0]][edge[1]],
            color: config.color.edge.base,
            selected: true
        })
    }
    return {
        nodes: node_list,
        links: edge_list
    }
}

/**
 * creates the graph from the given graph elements
 * @param {3D-Force-graph} Graph Graph object from the 3d-force-graph library
 * @param {object} graph_elements Object containing all of the nodes and edges for the graph to be created
 */
function buildGraph(graph, cy, graph_elements, graphList){
    
    //load in data
    graph.graphData(graph_elements)

    //node functions
    .nodeVal(()=>{
        return config.scale.node * GRAPH_DATA.nodeSize;
    })
    .nodeLabel((node)=>{
        //node label is a composite of all of the calculations that have been made on the node
        let name = `<div>${node.name}</div> <div>(${node.fx}, ${node.fy}, ${node.fz})</div>`;
        if(node.degree !== undefined){
            name += `<div>degree: ${node.degree}</div>`;
        }
        if(node.strength !== undefined){
            name += `<div>strength: ${node.strength}</div>`;
        }
        if(node.degreeCentrality !== undefined){
            name += `<div>Weighted Degree Centrality: ${node.degreeCentrality}</div>`;
        }
        if(node.betweennessCentrality !== undefined){
            name += `<div>Betweenness Centrality: ${node.betweennessCentrality}</div>`;
        }
        if(GRAPH_DATA.orbitColoring != null){
            name += `<div>Orbit ${GRAPH_DATA.orbitColoring} Frequency: ${node.orbits[GRAPH_DATA.orbitColoring]}</div>`
        }
        return name;
    })
    .nodeColor(node =>{
        if(node.selected){
            return node.color            
        } else {
            return config.color.node.fade;
        }
    })
    .nodeResolution(config.nodeResolution)
    .enableNodeDrag(false)
    .onNodeClick(node =>{
        if(node.id === GRAPH_DATA.highlightedNode){
            GRAPH_DATA.highlightedNode = null;
            deselectAll(graphList);
        } else {
            GRAPH_DATA.highlightedNode = node.id;
            deselectAll(graphList);
            highlightNeighbors(node.id, graphList);
        }
        updateGraph(graphList);
    })
    
    //edge functions
    .linkColor(edge =>{
        if(edge.selected){
            return edge.color;
        } else {
            return config.color.edge.fade;
        }

    })
    .linkDirectionalParticles(edge => {
        if(GRAPH_DATA.particles && edge.selected){
            return edge.value;
        } else {
            return 0
        }
    })
    .linkDirectionalParticleSpeed(edge =>{
        return edge.value * config.particleSpeed;
    })
    .linkDirectionalParticleWidth(edge =>{
        return config.scale.particles * GRAPH_DATA.edgeSize;
    })
    .linkDirectionalParticleResolution(config.particleResolution)

    .linkWidth( edge =>{
        if(GRAPH_DATA.edgeWeightToggled && edge.selected){
            return edge.value * GRAPH_DATA.edgeSize;
        } else {
            return 0;
        }
    })
    .onEngineTick(()=>{
        //link to cytoscape graph
        if(!cy.linked){
            linkToCytoscape(cy, graph);
        }
    })
    
}

/**
 * Links the Graph created by the graphics engine to the Cytoscape object. each cytoscape element
 * receives a reference to its corresponding element in the 3d-force-graph object. 
 */
function linkToCytoscape(cy, graph){
    cy.linked = true;

    //grab the nodes and edges from the Graph object
    let d3Nodes = graph.graphData().nodes;
    let d3Edges = graph.graphData().links;

    //build and connect nodes
    let cyNodes = d3Nodes.map(node =>{
        return {
            group: 'nodes',
            data: {
                id: String(node.id),
                name: node.name,
                color: config.color.node.base,
                nodeLink: node,
                orbits: node.orbits,
            }
        }
    })

    //build and connect edges
    let cyEdges = d3Edges.map(edge =>{
        return {
            group: 'edges',
            data: {
                id: 'Edge' + String(edge.index),
                color: config.color.edge.base,
                source: String(edge.source.id),
                target: String(edge.target.id),
                weight: edge.value,
                edgeLink: edge,
                sourceLink: edge.source,
                targetLink: edge.target
            }
        }
    })

    //add nodes and edges to the cytocape graph
    cy.add(cyNodes);
    cy.add(cyEdges);

    //set pick list values for the Focus Node picklist.
    if(!GRAPH_DATA.nodeListgenerated){
        GRAPH_DATA.nodeListgenerated = true;
        generateNodeList(cy);
    }
}

function addGrids(elements, scale, graph, graphName){
    if(!GRAPH_DATA.grids.size){
        GRAPH_DATA.grids.size = maxCoordinates(elements)
    }
    size = GRAPH_DATA.grids.size;

    let increments = size / scale;

    let XZgrid = createGrid(size, increments, 'xz') // default on XZ axis
    let XYgrid = createGrid(size, increments, 'xy')
    let YZgrid = createGrid(size, increments, 'yz')
    
    GRAPH_DATA.grids.xz[graphName] = XZgrid;
    GRAPH_DATA.grids.xy[graphName] = XYgrid;
    GRAPH_DATA.grids.yz[graphName] = YZgrid;


    var axesHelper = new THREE.AxesHelper(size);
    GRAPH_DATA.axis[graphName] = axesHelper;

    graph.scene().add(XZgrid);
    graph.scene().add(XYgrid);
    graph.scene().add(YZgrid);

    graph.scene().add(axesHelper)
}

function removeGrids(graph, graphName){
    [GRAPH_DATA.grids.xy, GRAPH_DATA.grids.xz, GRAPH_DATA.grids.yz].forEach(gridset =>{
        gridset[graphName].geometry.dispose();
        gridset[graphName].material.dispose();
        
        graph.scene().remove(gridset[graphName])
        gridset[graphName] = undefined;
    })
}

function createGrid(size, increments, plane){

    //create grid elements
    let grid = new THREE.GridHelper(size, increments);

    switch(plane){
        case 'xz':
            break;
        case 'xy':
            grid.rotateX(Math.PI / 2);
            break;
        case 'yz':
            grid.rotateZ(Math.PI / 2);
            break;
        default:
            break;
    }
    
    return grid;
}

function maxCoordinates(elements){
    let maxX = 0;
    let maxY = 0;
    let maxZ = 0;
    let numNodes = elements.nodes.length

    for(let i = 0; i < numNodes; i++){
        let x = Math.abs(elements.nodes[i].fx);
        let y = Math.abs(elements.nodes[i].fy);
        let z = Math.abs(elements.nodes[i].fz);

        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
        maxZ = Math.max(maxZ, z)
    }

    return Math.max(maxX, maxY, maxZ) * 2 // multiply by two because the coordinats are only the "radius" of the grid
}