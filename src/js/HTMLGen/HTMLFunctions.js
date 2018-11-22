
/**
 * generates a color scale by creating 100 1px tall divs and placing them in a column.
 * must loop through the given scale backwards. 
 * @param {Array} colorScale An Array of colors generated by Chroma.js length is 100
 */
function generateScale(colorScale){
    let num_colors = colorScale.length;
    let container = document.getElementById('scale-color-container');
    for(i = num_colors - 1; i >= 0; i--){
        let bar = document.createElement('div');
        bar.setAttribute("style", `background-color: ${colorScale[i]}; height: 1px; margin: 0 0 0 0; padding: 0 0 0 0;`)
        container.appendChild(bar);
    }
}

/**
 * Generates the numbers for each scale based on a maximum value. Divides the scale into 
 * quarters. 
 * @param {Number} maxNum The maximum number in the scale
 */
function generateScaleNumbers(maxNum){
    container = document.getElementById('scale-numbers');
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    maxNum = Math.round(maxNum)
    let quarter = Math.round(maxNum * .25);

    let highNum = maxNum;
    let highmidNum = highNum - quarter;
    let midNum = Math.round(highNum / 2);
    let lowmidNum = quarter;
    let lowNum = 0;

    [highNum, highmidNum, midNum, lowmidNum, lowNum].forEach(num =>{
        let temp = document.createElement('div')
        temp.classList.add('row', 'left-align');
        temp.setAttribute("style", "margin-bottom: 0 !important;")
        temp.innerHTML = num;
        container.appendChild(temp);
    })
    
}

/**
 * generates the node list for the Focus Node Dropdown. this will populate the dropdown with all 
 * of the node names in the graph. 
 */
function generateNodeList(cy){
    let input = document.getElementById('nodeList');
    let nodes = cy.nodes();
    let num_nodes = nodes.length;

    for(i = 0; i < num_nodes; i++){
        let option = document.createElement('option');
        option.setAttribute('value', nodes[i].id());
        option.innerHTML = nodes[i].data().name;
        input.appendChild(option);
    }

    let select = document.getElementById('nodeList');
    var instances = M.FormSelect.init(select, {});
}

/**
 * Hides the color scale
 */
function hideScale(){
    let container = document.getElementById('color-scale');
    container.classList.add('hide');
}

/**
 * shows the color scale
 */
function showScale(){
    let container = document.getElementById('color-scale');
    container.classList.remove('hide');
}

function hideFileInput(){
    let containers = document.getElementsByClassName('file-input-container');
    for(i = 0; i < containers.length; i++){
        containers[i].classList.add('hide');
    }
}
