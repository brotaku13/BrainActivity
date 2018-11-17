regex = [
    ['weight_matrix', /.*mean_mat.*/],
    ['coordinates', /.*coords.*/],
    ['edge_list', /.*_el/],
    ['node_names', /.*names_group.*/], 
    ['node_ids', /.*names_abbrev.*/]
]


function parseCSV(inputFile, data_name) {
    let delimiter = ' '
    if(data_name == 'weight_matrix'){
        delimiter = '   ';
    }

    Papa.parse(inputFile, {
        delimiter: delimiter,
        header: false,
        complete: function (results, file) {
            console.log("parsing complete: \n", results.data)
            if(data_name == 'weight_matrix'){
                cleanMatrix(results.data)
            }
            confirmLoad(results.data, data_name);
        },
        dynamicTyping: true,
        skipEmptyLines: true,
        transform: function (item) {
            return item.trim();
        },
        skipEmptyLines: true
    })
}

function parseMultiple(fileList, data_name){
    let num_files = fileList.length;
    console.log(fileList);
    //find filenames
    
    let fileNames = Object.values(fileList).map((file) =>{
        return file.name;
    })

    //search for files by datatype
    for(i = 0; i < regex.length; i++){
        
        for(j = 0; j < num_files; j++){
            if(fileNames[j].search(regex[i][1]) !== -1){
                console.log(regex[i], fileList[j]);
                parseCSV(fileList[j], regex[i][0]);
            }
        }
    }
}

function confirmLoad(data, data_name){
    file_data[data_name] = data;
    let icon = document.getElementById(data_name + '_icon');
    if(icon){
        icon.innerHTML = 'check';
    }
}

function cleanMatrix(data){
    data.forEach(row =>{
        row.shift();
    })
}