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