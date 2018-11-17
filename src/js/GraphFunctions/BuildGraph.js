
var highlightedNode = null;
var highlightedEdges = [];


const SCALE = 15
var PARTICLES = false;
var EDGE_WEIGHT = false;

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
            fx: coordinates[0] * SCALE,
            fy: coordinates[1] * SCALE,
            fz: coordinates[2] * SCALE,
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
            value: file_data.weight_matrix[edge[0]][edge[1]]
        })
    }
    console.log(edge_list); //logging
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
        return node.name;   
    })
    .nodeColor(node =>{
        if(node === highlightedNode){
            return 'rgb(255, 255, 255)'
        }
        return node.color
    })
    .nodeResolution(30)
    .enableNodeDrag(false)
    .onNodeClick(node =>{
        debugger;
        if(node === highlightedNode){
            highlightedNode = null;
        } else {
            highlightedNode = node
        }
        updateGraph(Graph);
    })
    
    //edge functions
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
}

//Updates the graph after making a change
function updateGraph(Graph){
    Graph.nodeRelSize(4);
}
