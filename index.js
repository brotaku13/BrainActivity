
var file_data = {};

document.addEventListener("DOMContentLoaded", function(){
    //get hight/width of container
    let container = document.getElementById('app-container')
    let dim = container.getBoundingClientRect()

    const Graph = ForceGraph3D();
    Graph(document.getElementById('3d-graph'))
        .width(dim.width * (10/12))
        .height(dim.height)

    let fileInputs = document.getElementsByClassName('file-input');
    for(i = 0; i < fileInputs.length; i++){
        fileInputs[i].addEventListener('change', (event) =>{
            let data_name = event.target.name;
            let file = event.target.files[0];
            if(file){
                parseCSV(file, data_name);
            }
        })
    }

    document.getElementById('create-graph').addEventListener('click', ()=>{
        if(file_data.edge_list && file_data.node_ids && file_data.node_names && file_data.coordinates){
            const graph_elements = createGraphElements(file_data);
            buildGraph(Graph, graph_elements);

        } else {
            alert('You have not loaded the necessary data')
        }
    })
})

// console.log('here')
// const N = 300;
// const gData = {
//     nodes: [...Array(N).keys()].map(i => ({ id: i , fx: i*i, fy: i*i, fz: i*i})),
//     links: [...Array(N).keys()]
//     .filter(id => id)
//     .map(id => ({
//         source: id,
//         target: Math.round(Math.random() * (id-1))
//     }))
// };
// Graph(document.getElementById('3d-graph'))
// .graphData(gData);