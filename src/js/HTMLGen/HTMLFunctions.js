

function generateNodeList(){
    let input = document.getElementById('nodeList');
    let nodes = cy.nodes();
    let num_nodes = nodes.length;

    for(i = 0; i < num_nodes; i++){
        let option = document.createElement('option');
        option.setAttribute('value', nodes[i].id());
        option.innerHTML = nodes[i].data().name;
        input.appendChild(option);
    }

    //init select javscript
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});
}