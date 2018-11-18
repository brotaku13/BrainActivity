

function highlightNeighbors(node){
    let elems = cy.nodes(`#${node.id}`);
    if(elems.length !== 0){

        let neighbors = elems.closedNeighborhood()
        //highlight node and its neighbors
        for(i = 0; i < neighbors.length; i++){
            let elem = neighbors[i];
            if(elem.isNode()){
                elem.data().nodeLink.color = NODE_HIGHLIGHT;
            } else {
                elem.data().edgeLink.color = EDGE_HIGHLIGHT;
            }
        }

        let notNeighbors = cy.elements().difference(neighbors);
        for(i = 0; i < notNeighbors.length; i++){
            let elem = notNeighbors[i];
            if(elem.isNode()){
                elem.data().nodeLink.color = NODE_FADE;
            } else {
                elem.data().edgeLink.color = EDGE_FADE;
            }
        }

    } else {
        console.log('Could not find specified node');
    }
}

function deselectAll(){
    let cyNodes = cy.nodes();
    let cyEdges = cy.edges();

    new Promise((resolve, reject) =>{
        for(i = 0; i < cyNodes.length; i++){
            cyNodes[i].data().nodeLink.color = BASE_NODE_COLOR
        }
    })
    new Promise((resolve, reject) =>{
        for(i = 0; i < cyEdges.length; i++){
            cyEdges[i].data().edgeLink.color = BASE_EDGE_COLOR
        }
    })
}

function focusNode(nodeId){
    let cyNodes = cy.nodes(`#${nodeId}`);
    let node = cyNodes[0].data().nodeLink;
    const distance = 100;
    const distRatio = 1 + distance / Math.hypot(node.fx, node.fy, node.fz);

    Graph.cameraPosition(
        {x: node.fx * distRatio, y: node.fy * distRatio, z: node.fz * distRatio}, //new position
        node, 
        3000 // transition time
    )
}