import React, { Component } from 'react';
import { StyleSheet, View, Button, Text, Image, CheckBox, ScrollView, NativeEventEmitter, Platform } from 'react-native';
import Regula from 'react-native-regula-test';
import * as RNFS from 'react-native-fs';
import RadioGroup from 'react-native-radio-buttons-group';
import ImagePicker from 'react-native-image-picker';
var RNRegulaDocumentReader = Regula.RNRegulaDocumentReader;
var DocumentReaderResults = Regula.DocumentReaderResults;

var licPath = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/regula.license") : "regula.license";
var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets;
RNRegulaDocumentReader.prepareDataBase({}, (respond) => { 
  console.log(respond);
  readFile(licPath, 'base64').then((res) => {
    RNRegulaDocumentReader.initialize({
      licenseKey: res
    }, (respond) => { console.log(respond) })
  });
});

const eventManager = new NativeEventEmitter(RNRegulaDocumentReader);
eventManager.addListener(
  'prepareDatabaseProgressChangeEvent',
  e => console.log(e["msg"])
);

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      fullName: "Surname and given names",
      doRfid: false,
      scenarios: [
        {
          label: "Mrz",
          value: 0
        },
        {
          label: "Barcode",
          value: 1
        },
        {
          label: "Locate",
          value: 2
        },
        {
          label: "Ocr",
          value: 3
        },
        {
          label: "DocType",
          value: 4
        },
        {
          label: "MrzOrBarcode",
          value: 5
        },
        {
          label: "MrzOrLocate",
          value: 6
        },
        {
          label: "MrzAndLocate",
          value: 7
        },
        {
          label: "MrzOrOcr",
          value: 8
        },
        {
          label: "MrzOrBarcodeOrOcr",
          value: 9
        },
        {
          label: "LocateVisual_And_MrzOrOcr",
          value: 10
        },
        {
          label: "FullProcess",
          value: 11
        },
        {
          label: "Id3Rus",
          value: 12
        }
      ],
      selectedScenario: "Mrz",
      portrait: require('./images/portrait.png'),
      docFront: require('./images/id.png')
    };
  }

  logResults(results) {
    console.log("=============================================");
    console.log("chipPage");
    console.log(results.chipPage);
    console.log("=============================================");
    console.log("overallResult");
    console.log(results.overallResult);
    console.log("=============================================");
    console.log("processingFinished");
    console.log(results.processingFinished);
    console.log("=============================================");
    console.log("morePagesAvailable");
    console.log(results.morePagesAvailable);
    console.log("=============================================");
    console.log("rfidResult");
    console.log(results.rfidResult);
    console.log("=============================================");
    console.log("highResolution");
    console.log(results.highResolution);
    console.log("=============================================");
    console.log("graphicResult");
    console.log(results.graphicResult);
    console.log("=============================================");
    console.log("textResult");
    console.log(results.textResult);
    console.log("=============================================");
    console.log("documentPosition");
    console.log(results.documentPosition);
    console.log("=============================================");
    console.log("barcodePosition");
    console.log(results.barcodePosition);
    console.log("=============================================");
    console.log("mrzPosition");
    console.log(results.mrzPosition);
    console.log("=============================================");
    console.log("imageQuality");
    console.log(results.imageQuality);
    console.log("=============================================");
    console.log("documentType");
    console.log(results.documentType);
    console.log("=============================================");
    console.log("jsonResult");
    console.log(results.jsonResult);
    console.log("=============================================");
    console.log("documentReaderNotification");
    console.log(results.documentReaderNotification);
    console.log("=============================================");
    console.log("rfidSessionData");
    console.log(results.rfidSessionData);
    console.log("=============================================");
    console.log("authenticityCheckList");
    console.log(results.authenticityCheckList);
    console.log("=============================================");
  }

  displayResults(jstring) {
    if (jstring != "Canceled" && jstring.substring(0, 5) != "Error") {
      var results = DocumentReaderResults.fromJson(JSON.parse(jstring));
      this.setState({ fullName: results.getTextFieldValueByType(25) });
      if (results.getGraphicFieldImageByType(207) != null) {
        var base64DocFront = "data:image/png;base64," + results.getGraphicFieldImageByType(207);
        this.setState({ docFront: { uri: base64DocFront } });
      }
      if (results.getGraphicFieldImageByType(201) != null) {
        var base64Portrait = "data:image/png;base64," + results.getGraphicFieldImageByType(201);
        this.setState({ portrait: { uri: base64Portrait } });
      }
      //this.logResults(results);
    }
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={{
          top: 1,
          left: 1,
          padding: 10,
          fontSize: 20,
        }}>
          {this.state.fullName}
        </Text>
        <View style={{ flexDirection: "row", padding: 5 }}>
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <Text style={{
              top: 1,
              right: 1,
              padding: 5,
            }}>
              Portrait
        </Text>
            <Image
              style={{
                height: 150,
                width: 150,
              }}
              source={this.state.portrait}
              resizeMode="contain"
            />
          </View>
          <View style={{ flexDirection: "column", alignItems: "center", padding: 5 }}>
            <Text style={{
              top: 1,
              right: 1,
              padding: 5,
            }}>
              Document image
        </Text>
            <Image
              style={{
                height: 150,
                width: 200,
              }}
              source={this.state.docFront}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView style={{ padding: 5, alignSelf: 'stretch' }}>
          <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={this.state.scenarios} onPress={(data) => {
            this.setState({ data });
            var selectedItem;
            for (var index in data) {
              if (data[index]['selected']) {
                selectedItem = data[index]['label'];
              }
            }
            this.setState({ selectedScenario: selectedItem })
          }} />
        </ScrollView>

        <View style={{ flexDirection: 'row', padding: 5 }}>
          <CheckBox
            title='Click Here'
            value={this.state.doRfid}
            onChange={() => this.setState({ doRfid: !this.state.doRfid })}
          />
          <Text style={{
            padding: 5,
          }}>
            Process rfid reading
        </Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Button
            onPress={() => {
              RNRegulaDocumentReader.scan({
                functionality: {
                  videoCaptureMotionControl: true,
                },
                customization: {
                  showResultStatusMessages: true,
                  showStatusMessages: true
                },
                processParams: {
                  scenario: this.state.selectedScenario,
                  doRfid: this.state.doRfid,
                },
              },
                (jstring) => {
                  if(jstring.substring(0, 8) == "Success:")
                    this.displayResults(jstring.substring(8));
                });
            }}
            title="Scan document"
          />
          <Text style={{ padding: 5 }}></Text>
          <Button
            onPress={() => {
              ImagePicker.showImagePicker({}, (response) => {
                if (response.didCancel) {
                  console.log('User cancelled image picker');
                } else if (response.error) {
                  console.log('ImagePicker Error: ', response.error);
                } else if (response.customButton) {} else {
                  RNRegulaDocumentReader.scanImage({
                    functionality: {
                      videoCaptureMotionControl: true,
                    },
                    customization: {
                      showResultStatusMessages: true,
                      showStatusMessages: true
                    },
                    processParams: {
                      scenario: this.state.selectedScenario,
                      doRfid: this.state.doRfid,
                    },
                  },
                    response.data,
                    (jstring) => {
                      if(jstring.substring(0, 8) == "Success:")
                        this.displayResults(jstring.substring(8));
                    });
                }
              });
            }}
            title="     Scan image     "
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginBottom: 12,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
