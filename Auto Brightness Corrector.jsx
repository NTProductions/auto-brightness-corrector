app.beginUndoGroup("Auto Brightness Corrector");
main();
app.endUndoGroup();
function main() {
var goalBrightness = 300;
var layer = app.project.activeItem.selectedLayers[0];
var exposureEffect = layer.Effects.addProperty("ADBE Exposure2");
var exposureProperty = exposureEffect.property(3);
var brightness = setupComp(app.project.activeItem, layer, exposureProperty, goalBrightness);
// brightness range 0-765 [black-white]
}

function setupComp(comp, layer, exposureProperty, goalBrightness) {
var brightness = 0;

var pointControl = layer.Effects.addProperty("ADBE Point Control");
var point = layer("Effects")("Point Control")("Point");

var redText = comp.layers.addText();
var redSourceText = redText.property("Source Text");
redSourceText.expression = 'targetLayer = thisComp.layer("' + layer.name + '"); samplePoint = targetLayer.effect("Point Control")("Point"); sampleRadius = [1,1]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius); R = Math.round(sampledColor_8bpc[0]); outputString = R';

var greenText = comp.layers.addText();
var greenSourceText = greenText.property("Source Text");
greenSourceText.expression = 'targetLayer = thisComp.layer("' + layer.name + '"); samplePoint = targetLayer.effect("Point Control")("Point"); sampleRadius = [1,1]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius); G = Math.round(sampledColor_8bpc[1]); outputString = G';

var blueText = comp.layers.addText();
var blueSourceText = blueText.property("Source Text");
blueSourceText.expression = 'targetLayer = thisComp.layer("' + layer.name + '"); samplePoint = targetLayer.effect("Point Control")("Point"); sampleRadius = [1,1]; sampledColor_8bpc = 255 * targetLayer.sampleImage(samplePoint, sampleRadius); B = Math.round(sampledColor_8bpc[2]); outputString = B';
var guess;
var guessBool = false;
if(Math.floor(analysePixels(comp, layer, point, pointControl, redText, greenText, blueText, redSourceText, greenSourceText, blueSourceText, exposureProperty, 0)) > goalBrightness) {
    guess = -10;
    guessBool = true;
    } else {
    guess = 10;
        }
do {
brightness = Math.floor(analysePixels(comp, layer, point, pointControl, redText, greenText, blueText, redSourceText, greenSourceText, blueSourceText, exposureProperty, guess));
$.writeln("brightness = " + brightness);
if(brightness < goalBrightness -10 || brightness > goalBrightness +10) {
    if(guessBool) {
            guess += .2;
        } else {
            guess -= .2;
            }
    }
} while (brightness < goalBrightness - 10 || brightness > goalBrightness + 10);

cleanup(redText, greenText, blueText, pointControl);
return brightness;
}

function analysePixels(comp, layer, point, pointControl, redText, greenText, blueText, redSourceText, greenSourceText, blueSourceText, exposureProperty, guess){
        layer.Effects.property("ADBE Exposure2").property(3).setValue(guess);
        var width, height, pixels;
        var intensities = [];
    width = comp.width;
    height = comp.height;
    pixels = width * height;

for(var i = 1; i <= width; i += 250){
           
        for(var e = 1; e <= height; e += 250){
            point.setValue([i, e]);
            intensities.push(parseInt(redSourceText.value)+parseInt(greenSourceText.value)+parseInt(blueSourceText.value));
            }   
    }
    var average = calculateAverage(intensities);
    return average;
}

function calculateAverage(array) {
        var length = array.length;
        var result = 0;
        for(var i = 0; i < array.length; i++) {
            result+=array[i];
            }
        result /= length;
        return result;
    }

function cleanup(redText, greenText, blueText, pointControl) {
redText.remove();
greenText.remove();
blueText.remove();
pointControl.remove();
}