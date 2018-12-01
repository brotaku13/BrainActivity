

function loadDataController() {

    //load in and create config data
    makeRequest('get', 'src/config/config.json')
    .then((configFile) =>{
        config = JSON.parse(configFile);
        return config
    })
    .catch((error) =>{
        alert('Error Loading Config File!')
        console.log(error)
    }).then((config)=>{
        //load in all of the graph data asyncronously
        return Promise.all(config.filepaths.graphDataPaths.map(pathObject =>{
            return makeRequest('GET', pathObject.path).then(file =>{
                parseCSV(file, pathObject.name, pathObject.target);
            }).catch((error)=>{
                alert('Error Loading Data!')
                console.log(error)
            })
        }))
    }).then(()=>{
        //build the graphs from GRAPH_DATA
        console.log(GRAPH_DATA);
        buildGraphsController();
    })
}

function makeRequest(method, filepath) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, filepath);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function parseCSV(inputFile, data_name, target) {
    let delimiter = ' '
    if (data_name == 'weight_matrix') {
        delimiter = '   ';
    }

    Papa.parse(inputFile, {
        delimiter: delimiter,
        header: false,
        complete: function (results, file) {
            console.log("parsing complete: \n", results.data)
            if (data_name == 'weight_matrix') {
                results.data.forEach(row => {
                    row.shift();
                })

            }
            GRAPH_DATA[target][data_name] = results.data;
        },
        dynamicTyping: true,
        skipEmptyLines: true,
        transform: function (item) {
            return item.trim();
        },
        skipEmptyLines: true
    })
}
