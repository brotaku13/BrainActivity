const CON_FILES = {
    edge_list: '../../Data/CON/con_17_el',
    weight_matrix: '../../Data/CON/con_17_mean_mat.txt',
    coordinaates: '../../Data/CON/CON_region_centers_mm_coords_group_mean_3x200.txt',
    node_ids: '../../Data/CON/CON_region_names_abbrev_group_mean_1x200.txt',
    node_names: '../../Data/CON/CON_region_names_group_mean_1x200'
}

const OCD_FILES = {
    edge_list: '../../Data/OCD/ocd_19_el',
    weight_matrix: '../../Data/OCD/ocd_19_mean_mat.txt',
    coordinaates: '../../Data/OCD/OCD_region_centers_mm_coords_group_mean_3x200.txt',
    node_ids: '../../Data/OCD/OCD_region_names_abbrev_group_mean_1x200.txt',
    node_names: '../../Data/OCD/OCD_region_names_group_mean_1x200'
}

function loadDataFromFile(groupName){
    let file_group;
    if(groupName === 'OCD'){
        file_group = OCD_FILES;
    } else {
        file_group = CON_FILES
    }
    console.log('begin input');
    parseCSV(file_group.edge_list);
    parseCSV(file_group.coordinaates);
    parseCSV(file_group.names);
    parseCSV(file_group.node_names);
    console.log('end input')
}

function parseCSV(inputFile, data_name) {
    Papa.parse(inputFile, {
        delimiter: ' ',
        header: false,
        complete: function (results, file) {
            console.log("parsing complete: \n", results.data)
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

function confirmLoad(data, data_name){
    file_data[data_name] = data;
    let icon = document.getElementById(data_name + '_icon');
    icon.innerHTML = 'check';
}