//controls the spacing between coordinates. Scaled up to allow for a more 
// spread out look while keeping the same ratio distances
const SPACING_SCALE = 15;

//colors of uncolored nodes. 
const BASE_NODE_COLOR = 'rgb(64,196,255)';
const BASE_EDGE_COLOR = 'rgb(255, 255, 255)';

//colors of nodes which have not been selected
const NODE_FADE = 'rgba(207, 216, 220, 0.2)';
const EDGE_FADE = 'rgba(207, 216, 220, 0.2)';

//scaling factor for edge and node size
var EDGE_SCALE = 1;
var NODE_SCALE = 1

//Control wether particles and edge weights are shown
var PARTICLES = false;
var EDGE_WEIGHT = false;

//use to tell if the graph should display orbit frequency
var ORBIT_COLORING = null

//managed which nodes are highlighted
var highlightedNode = null;

var nodeListGenerated = false;


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
            fx: coordinates[0] * SPACING_SCALE,
            fy: coordinates[1] * SPACING_SCALE,
            fz: coordinates[2] * SPACING_SCALE,
            orbits: group_data.orbits ? group_data.orbits[i] : [],
            color: '#40C4FF',
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
            color: BASE_EDGE_COLOR,
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
function buildGraph(graph, cy, graph_elements, graphs){
    
    //load in data
    graph.graphData(graph_elements)

    //node functions
    .nodeVal(()=>{
        return 50 * NODE_SCALE;
    })
    .nodeLabel((node)=>{
        //node label is a composite of all of the calculations that have been made on the node
        let name = `<div>${node.name}</div>`;
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
        if(ORBIT_COLORING != null){
            name += `<div>Orbit ${ORBIT_COLORING} Frequency: ${node.orbits[ORBIT_COLORING]}</div>`
        }
        return name;
    })
    .nodeColor(node =>{
        if(node.selected){
            return node.color            
        } else {
            return NODE_FADE;
        }
    })
    .nodeResolution(30)
    .enableNodeDrag(false)
    .onNodeClick(node =>{
        if(node.id === highlightedNode){
            highlightedNode = null;
            deselectAll(graphs);
        } else {
            highlightedNode = node.id;
            deselectAll(graphs);
            highlightNeighbors(node.id, graphs);
        }
        updateGraph(graphs);
    })
    
    //edge functions
    .linkColor(edge =>{
        if(edge.selected){
            return edge.color;
        } else {
            return EDGE_FADE;
        }

    })
    .linkDirectionalParticles(edge => {
        if(PARTICLES && edge.selected){
            return edge.value;
        } else {
            return 0
        }
    })
    .linkDirectionalParticleSpeed(edge =>{
        return edge.value * .001;
    })
    .linkDirectionalParticleWidth(edge =>{
        return 3 * EDGE_SCALE
    })
    .linkDirectionalParticleResolution(5)
    .linkWidth( edge =>{
        if(EDGE_WEIGHT && edge.selected){
            return edge.value * EDGE_SCALE;
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
                color: BASE_NODE_COLOR,
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
                color: BASE_EDGE_COLOR,
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
    if(!nodeListGenerated){
        nodeListGenerated = true;
        generateNodeList(cy);
    }
    
}
