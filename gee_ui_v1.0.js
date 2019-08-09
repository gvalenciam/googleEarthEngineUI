/***************NOTE: The geometry variable must be defined in the web app as a polygon (use drawing tools)***************/

/***************************** GEE varaibles and indexes definitions ***************************/

var AOIGeometry;
var AOIGeometryCentroid;

//Dates
var startSliderDate = '1984-01-01';
var endSliderDate = Date.now();

var dateValueStart;
var dateValueEnd;

//Satellites: Landsat 8, Landsat 7, Landsat 5, Sentinel 2
var satellitesDropdownItems = [{label: 'LandSat 8', value: 'LANDSAT/LC08/C01/T1_TOA'}, {label: 'LandSat 7', value: 'LANDSAT/LE07/C01/T1_TOA'}, {label: 'LandSat 5', value: 'LANDSAT/LT05/C01/T1_TOA'}, {label: 'Sentinel 2', value: 'COPERNICUS/S2_SR'}];
var satellites = ['LANDSAT/LC08/C01/T1_TOA', 'LANDSAT/LE07/C01/T1_TOA', 'LANDSAT/LT05/C01/T1_TOA', 'COPERNICUS/S2_SR'];

//bands: nir, red
var NDVISatelliteBands = [['B5', 'B4'], ['B4', 'B3'], ['B4', 'B3'], ['B8', 'B3']];

//green, red, nir, swir2
var WRISatelliteBands = [['B3', 'B4', 'B5', 'B7'], ['B2', 'B3', 'B4', 'B7'], ['B2', 'B3', 'B4', 'B7'], ['B3', 'B4', 'B8', 'B12']];

//nir, red
var NDMISatelliteBands = [['B5', 'B4'], ['B4', 'B3'], ['B4', 'B3'], ['B8', 'B3']];

//green, swir2
var MNDWISatelliteBands = [['B3', 'B7'], ['B2', 'B7'], ['B2', 'B7'], ['B3', 'B12']];

//green, nir
var NDWISatelliteBands = [['B3', 'B5'], ['B2', 'B4'], ['B2', 'B4'], ['B3', 'B8']];

//blue, green, nir, swir1, swir2
var AWEIshSatelliteBands = [['B2', 'B3', 'B5', 'B6', 'B7'], ['B1', 'B2', 'B4', 'B5', 'B7'], ['B1', 'B2', 'B4', 'B5', 'B7'], ['B2', 'B3', 'B8', 'B11', 'B12']];

//green, swir2, nir, swir1
var AWEInshSatelliteBands = [['B3', 'B7', 'B5', 'B6'], ['B2', 'B7', 'B4', 'B5'], ['B2', 'B7', 'B4', 'B5'], ['B3', 'B12', 'B8', 'B11']];

var cloudFilterSatelliteBands = [['BQA', 4, 4], ['BQA', 5, 6], ['BQA', 5, 6], ['QA60', 10, 11]];

var indexLabel = ['NDVI', 'WRI', 'NDMI', 'MNDWI', 'NDWI', 'AWEIsh', 'AWEInsh'];
var visIndexes = [
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]},
    {min:-1.0, max:1.0, palette:["000000", "FFFFFF"]}
];

//Landsat8 = 0, Landsat7 = 1, Landsat5 = 2, Sentinel2 = 3
var selector = 0;

function maskClouds(image){
    var qa = image.select(cloudFilterSatelliteBands[selector][0]);
    var cloudBitMask = ee.Number(2).pow(cloudFilterSatelliteBands[selector][1]).int();
    var cirrusBitMask = ee.Number(2).pow(cloudFilterSatelliteBands[selector][2]).int();
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask);
}

//NDVI
function getNDVI(image){
    var NDVI = image.expression('(nir - red)/(nir + red)',
        {'nir':image.select(NDVISatelliteBands[selector][0]),
         'red':image.select(NDVISatelliteBands[selector][1])});
    return NDVI;
}

//WRI
function getWRI(image){
    var WRI = image.expression('(green + red)/(nir + swir2)',
        {'green':image.select(WRISatelliteBands[selector][0]),
            'red':image.select(WRISatelliteBands[selector][1]),
            'nir':image.select(WRISatelliteBands[selector][2]),
            'swir2':image.select(WRISatelliteBands[selector][3])});
    return WRI;
}

//NDMI
function getNDMI(image){
    var NDMI = image.expression('(red - nir)/(red + nir)',
        {'nir':image.select(NDMISatelliteBands[selector][0]),
            'red':image.select(NDMISatelliteBands[selector][1])});
    return NDMI;
}

//MNDWI
function getMNDWI(image){
    var MNDWI = image.expression('(green - swir2)/(green + swir2)',
        {'green':image.select(MNDWISatelliteBands[selector][0]),
            'swir2':image.select(MNDWISatelliteBands[selector][1])});
    return MNDWI;
}

//NDWI
function getNDWI(image){
    var NDWI = image.expression('(green - nir)/(green + nir)',
        {'green':image.select(NDWISatelliteBands[selector][0]),
            'nir':image.select(NDWISatelliteBands[selector][1])});
    return NDWI;
}

//AWEIsh
function getAWEIsh(image){
    var AWEIsh = image.expression('(blue + 2.5*green - 1.5*(nir + swir1))',
        {'blue':image.select(AWEIshSatelliteBands[selector][0]),
            'green':image.select(AWEIshSatelliteBands[selector][1]),
            'nir':image.select(AWEIshSatelliteBands[selector][2]),
            'swir1':image.select(AWEIshSatelliteBands[selector][3]),
            'swir2':image.select(AWEIshSatelliteBands[selector][4])});
    return AWEIsh;
}

//AWEInsh
function getAWEI(image){
    var AWEInsh = image.expression('4*(green - swir2)-(0.25*nir + 2.75*swir1)',
        {'green':image.select(AWEInshSatelliteBands[selector][0]),
            'swir2':image.select(AWEInshSatelliteBands[selector][1]),
            'nir':image.select(AWEInshSatelliteBands[selector][2]),
            'swir1':image.select(AWEInshSatelliteBands[selector][3])});
    return AWEInsh;
}


/************************************* UI Elements ****************************************/

//Fusion Table ID header
var fusionTableIDHeader = ui.Label('Fusion Table ID');

//Fusion Table ID Textbox
var textboxID = ui.Textbox({
    value: '',
    placeholder: 'Enter fusion table ID ...',
    onChange: function(text) {text = ui.Textbox.getValue;},
    style: {width: '90%'}
});

//Datasets header
var datasetsHeader = ui.Label('Data Sets');

//Satellite dropdown selection
var satSelect = ui.Select({
    items: satellitesDropdownItems,
    value: satellites[0],
    onChange: function(value) {selector = satellites.indexOf(value);}
});

//Start date header
var startDateHeader = ui.Label('Start Date');

//Date start slider selection
var dateSliderStart = ui.DateSlider({
    start: startSliderDate,
    value: null,
    period: 1,
    onChange: function(value){dateValueStart = value;},
    style: {width: '90%'}
});

//End date header
var endDateHeader = ui.Label('End Date');

//Date end slider selection
var dateSliderEnd = ui.DateSlider({
    start: startSliderDate,
    value: endSliderDate,
    period: 1,
    onChange: function(value){dateValueEnd = value;},
    style: {width: '90%'}
});

//Water indexes header
var waterIndexesHeader = ui.Label('Water Indexes');

var checkboxList = [];
var checkboxLabels = [['NDVI', getNDVI], ['WRI', getWRI], ['NDMI', getNDMI], ['MNDWI', getMNDWI], ['NDWI', getNDWI], ['AWEIsh', getAWEIsh], ['AWEInsh', getAWEI]];

//Indexes checkboxes
for (var i = 0; i < checkboxLabels.length; i++){
    checkboxList.push(ui.Checkbox(checkboxLabels[i][0], false));
}

//Error label
var errorLabel = ui.Label('Wrong dates: end date must be after start date');
errorLabel.style().set('shown', false);
errorLabel.style().set('color', '#FF0000');

//Start process button callback
var button = ui.Button({
    label: 'Run',
    onClick: function() {

        Map.clear();

        if(textboxID.getValue() !== ''){
            AOIGeometry = ee.FeatureCollection(("ft:").concat(textboxID.getValue())).geometry();
            AOIGeometryCentroid = bufferGeometry.centroid(1);
        }else{
            AOIGeometry = geometry;
            AOIGeometryCentroid = geometry.centroid(1);
        }

        var dateValueStart = dateSliderStart.getValue()[0];
        var dateValueEnd = dateSliderEnd.getValue()[1];

        var imageCollection = ee.ImageCollection(satellites[selector]).filterDate(dateValueStart, dateValueEnd).filterBounds(AOIGeometry);

        if(dateValueEnd > dateValueStart) {

            errorLabel.style().set('shown', false);
            Map.centerObject(AOIGeometryCentroid, 11);

            checkboxList.forEach(function(checkbox){if(checkbox.getValue() === true){Map.addLayer(imageCollection.map(maskClouds).map(checkboxLabels[checkboxList.indexOf(checkbox)][1]).median().clip(AOIGeometry), visIndexes[checkboxList.indexOf(checkbox)], checkboxLabels[checkboxList.indexOf(checkbox)][0])}});

        }else{
            errorLabel.style().set('shown', true);
        }

    }
});

var generalContainer = ui.Panel({layout: ui.Panel.Layout.flow('horizontal')});
generalContainer.style().set({width: '520px'});

var leftPanel = ui.Panel();
leftPanel.style().set({width: '250px'});

var rightPanel = ui.Panel();
rightPanel.style().set({width: '250px'});

Map.clear();
ui.root.add(generalContainer);
generalContainer.add(leftPanel);
generalContainer.add(rightPanel);

leftPanel.add(ui.Label('Fusion Table ID'));
leftPanel.add(textboxID);
leftPanel.add(ui.Label('Data Sets'));
leftPanel.add(satSelect);
leftPanel.add(ui.Label('Range Date'));
leftPanel.add(ui.Label('Start Date', {fontSize: '12px'}));
leftPanel.add(dateSliderStart);
leftPanel.add(ui.Label('End Date', {fontSize: '12px'}));
leftPanel.add(dateSliderEnd);
rightPanel.add(ui.Label('Indexes of Water'));
checkboxList.forEach(function(checkbox){rightPanel.add(checkbox);});
rightPanel.add(button);
rightPanel.add(errorLabel);