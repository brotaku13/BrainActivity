
var highlightedNode = null;
var highlightedEdges = [];

const SPACING_SCALE = 15

const BASE_NODE_COLOR = 'rgb(64,196,255)';
const BASE_EDGE_COLOR = 'rgb(255, 255, 255)';

const NODE_HIGHLIGHT = 'rgb(255, 0, 0)';
const EDGE_HIGHLIGHT = 'rgb(0, 255, 0)';

const NODE_FADE = 'rgba(64, 196, 255, 0.4)';
const EDGE_FADE = 'rgba(255, 255, 255, 0.4)';

var PARTICLES = false;
var EDGE_WEIGHT = false;

var cytoscapeLinked = false;

//creates the graph elements from the files included
function createGraphElements(file_data){
    let num_nodes = file_data.node_ids.length;
    let node_list = []
    
    //setting nodess
    for(i = 0; i < num_nodes; i++){
        let node_name = file_data.node_names[i][0];
        let id = file_data.node_ids[i][0];
        let coordinates = file_data.coordinates[i];
        node_list.push({
            name: node_name,
            id: id - 1,
            fx: coordinates[0] * SPACING_SCALE,
            fy: coordinates[1] * SPACING_SCALE,
            fz: coordinates[2] * SPACING_SCALE,
            color: '#40C4FF'
        })
    }

    //setting edges. Called "links" in this particular library
    let num_edges = file_data.edge_list.length;
    let edge_list= [];
    for(i = 0; i < num_edges; i++){
        let edge = file_data.edge_list[i];
        edge_list.push({
            source: edge[0],
            target: edge[1],
            value: file_data.weight_matrix[edge[0]][edge[1]],
            color: BASE_EDGE_COLOR
        })
    }
    return {
        nodes: node_list,
        links: edge_list
    }
}

//builds the graph functions 
function buildGraph(Graph, graph_elements){
    
    Graph(document.getElementById('3d-graph'))
    //load in data
    .graphData(graph_elements)

    //node functions
    .nodeVal(()=>{
        return 10
    })
    .nodeLabel((node)=>{
        // debugger;
        return node.name
    })
    .nodeColor(node =>{
        return node.color
    })
    .nodeResolution(30)
    .enableNodeDrag(false)
    .onNodeClick(node =>{
        if(node === highlightedNode){
            highlightedNode = null;
            deselectAll();
        } else {
            highlightedNode = node;
            deselectAll();
            highlightNeighbors(node);
        }
        updateGraph(Graph);
    })
    
    //edge functions
    .linkColor(edge =>{
        return edge.color;
    })
    .linkDirectionalParticles(edge => {
        if(PARTICLES){
            return edge.value;
        } else {
            return 0
        }
    })
    .linkDirectionalParticleSpeed(edge =>{
        return edge.value * .001;
    })
    .linkDirectionalParticleWidth(3)
    .linkDirectionalParticleResolution(5)
    .linkWidth( edge =>{
        if(EDGE_WEIGHT){
            return edge.value;
        } else {
            return 0;
        }
    })
    .onEngineTick(()=>{
        //link to cytoscape graph
        if(!cytoscapeLinked){
            linkToCytoscape();
        }
    })
}

//Updates the graph after making a change
function updateGraph(Graph){
    Graph.nodeRelSize(4);
}

function linkToCytoscape(){
    cytoscapeLinked = true;

    let d3Nodes = Graph.graphData().nodes;
    let d3Edges = Graph.graphData().links;

    let cyNodes = d3Nodes.map(node =>{
        return {
            group: 'nodes',
            data: {
                id: String(node.id),
                name: node.name,
                color: BASE_NODE_COLOR,
                nodeLink: node
            }
        }
    })

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
    cy.add(cyNodes);
    cy.add(cyEdges);
}
