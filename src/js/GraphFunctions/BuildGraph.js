
var highlightedNodes = [];
var highlightedEdges = [];

function createGraphElements(file_data){
    let num_nodes = file_data.node_ids.length;
    let node_list = []
    for(i = 0; i < num_nodes; i++){
        let node_name = file_data.node_names[i][0];
        let id = file_data.node_ids[i][0];
        let coordinates = file_data.coordinates[i];
        node_list.push({
            name: node_name,
            id: id - 1,
            fx: coordinates[0] * 15,
            fy: coordinates[1] * 15,
            fz: coordinates[2] * 15,
            color: '#40C4FF'
        })
    }

    let num_edges = file_data.edge_list.length;
    let edge_list= [];
    for(i = 0; i < num_edges; i++){
        let edge = file_data.edge_list[i];
        edge_list.push({
            source: edge[0],
            target: edge[1]
        })
    }

    return {
        nodes: node_list,
        links: edge_list
    }
}

function buildGraph(Graph, graph_elements){
    Graph(document.getElementById('3d-graph'))
    .graphData(graph_elements)
    .nodeVal(()=>{
        return 10
    })
    .nodeLabel((node)=>{
        return `${node.id} - ${node.name}`;
    })
    .nodeColor(node =>{
        return node.color
    })
    .nodeResolution(30)
    .enableNodeDrag(false)
}